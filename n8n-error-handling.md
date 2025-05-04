# Error Handling in n8n Custom Nodes

## Core Error Handling Concepts

### Error Classes
- **NodeApiError**: For API-related errors that occur during external service interactions
- **NodeOperationError**: For general operation errors within node logic

### NodeApiError vs NodeOperationError

**NodeApiError:**
- Specifically designed for errors during API calls or external service interactions
- Preserves original API error information (status codes, response bodies)
- Includes request details that caused the error
- Helps n8n handle retries and rate limiting appropriately
- Use when your node makes HTTP requests, database connections, or other external service calls
- Takes the node reference, the original error, and optionally a custom error options object

**NodeOperationError:**
- For general operational errors within your node's logic
- Used for input validation errors, configuration issues, or any error not related to external API calls
- Simpler structure focused on clear error messaging
- Best for logical errors or missing configuration errors
- Takes the node reference, a descriptive error message, and optionally an options object (with properties like 'level')

### Key Features to Implement
- Error detection and classification
- Proper error wrapping
- Support for "Continue on Fail" option
- Error metadata enhancement

## Implementation Patterns (Verified from Official Nodes)

### 1. API Error Handling
```typescript
import { NodeApiError } from 'n8n-workflow';

try {
  // API call - using common patterns from official nodes
  const response = await apiRequest.call(this, 'GET', endpoint, body, qs);
} catch (error) {
  // Standard throw pattern seen in Github, Gmail, Gitlab nodes
  throw new NodeApiError(this.getNode(), error as JsonObject);
}
```

### 2. Operation Error Handling
```typescript
import { NodeOperationError } from 'n8n-workflow';

// Validation error pattern common in official nodes
if (!inputData.hasOwnProperty('requiredField')) {
  throw new NodeOperationError(
    this.getNode(),
    'Required field missing'
  );
}

// Operation error with warning level - seen in GithubTrigger.node.ts
throw new NodeOperationError(
  this.getNode(),
  'A webhook with the identical URL probably exists already. Please delete it manually!',
  { level: 'warning' }
);
```

### 3. Enhanced Error Metadata with Custom Messages
```typescript
// Custom error messaging pattern from Gmail and Zoho implementations
throw new NodeApiError(this.getNode(), error as JsonObject, {
  message: 'Custom error message based on status code or condition',
  description: 'More detailed explanation to help the user resolve the issue',
});
```

### 4. Continue on Fail Implementation
```typescript
private continueOnFail(): boolean {
  return this.getNodeParameter('continueOnFail', 0, false) as boolean;
}
```

### 5. Complete Execute Method Pattern (Verified from Official Nodes)
```typescript
async execute() {
  try {
    // Node execution logic
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        // Process individual item
        const result = await this.processItem(items[i], i);
        returnData.push({ json: result });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error.message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }
    
    return this.prepareOutputData(returnData);
    
  } catch (error) {
    // Handle top-level errors
    if (error.cause?.response) {
      // API error with response data
      throw new NodeApiError(this.getNode(), error);
    } else if (error.cause?.httpCode) {
      // API error with HTTP status code
      // Many official nodes check for specific status codes
      // Example: error.cause.httpCode === '404'
      throw new NodeApiError(this.getNode(), error, {
        message: 'Resource not found', // Custom message based on status code
        description: 'The requested resource does not exist',
      });
    } else {
      // General operational error
      throw new NodeOperationError(this.getNode(), error.message, { 
        level: 'warning' // Optional parameter to control UI display
      });
    }
  }
}
```

## Node Description Configuration

Include error handling options in your node description:

```typescript
export class MyCustomNode implements INodeType {
  description: INodeTypeDescription = {
    // Other node properties...
    properties: [
      // Other node properties...
      {
        displayName: 'Continue On Fail',
        name: 'continueOnFail',
        type: 'boolean',
        default: false,
        description: 'Continue execution even when the node runs into an error',
      },
    ],
  };
}
```

## Best Practices (Based on Official Implementations)

1. **Informative Error Messages**: Always provide clear, actionable error messages with context about what failed and why
2. **Status Code Specific Handling**: Different HTTP status codes often need different error messages (e.g., 404 vs 403 vs 500)
3. **Consistent Error Handling**: Apply the same pattern throughout your node as seen in official implementations
4. **Preserve Original Errors**: Pass the original error object to NodeApiError to maintain complete error information
5. **Use Warning Level**: For non-critical errors, use the `{ level: 'warning' }` option
6. **Custom Error Messages**: Provide user-friendly error messages that are more helpful than raw API errors
7. **Structured Error Options**: Use the error options object to provide formatted information that n8n can display properly
8. **Test Error Scenarios**: Validate all possible error paths in your node's execution
