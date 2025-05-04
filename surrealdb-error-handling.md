# SurrealDB Error Handling in n8n

This document outlines the specific approach we take for error handling when integrating SurrealDB with n8n. It builds upon the general error handling patterns in `n8n-error-handling.md`.

## SurrealDB-Specific Error Handling Patterns

### 1. Record Not Found Detection

SurrealDB returns `null` for various scenarios that should be treated differently in n8n:

- When a record doesn't exist in an existing table
- When a table doesn't exist at all

**Our Approach:**
```typescript
// Execute the select operation
const result = await client.select(recordId);

// Check if the record was found
if (result !== null && result !== undefined && (typeof result !== 'object' || Object.keys(result).length > 0)) {
  // Process found record
  return [...formattedResult];
}

// If not found, throw an operation error
throw new NodeOperationError(
  executeFunctions.getNode(),
  `Record not found: ${recordId.toString()}`,
  { itemIndex }
);
```

This implementation:
- Treats not-found records as errors rather than empty results
- Allows workflows to handle not-found conditions using n8n's continueOnFail functionality
- Provides clear error messaging that includes the record ID

### 2. SurrealDB Error Response Detection

SurrealDB operations can return success responses that actually contain errors. We need to detect these explicitly:

```typescript
// Check if the result contains an error (SurrealDB format)
if (result[0] && result[0].status === 'ERR') {
  throw new NodeOperationError(
    executeFunctions.getNode(),
    `SurrealDB error: ${result[0].detail}`,
    { itemIndex }
  );
}
```

### 3. Maintaining Operation Context with Proper itemIndex

SurrealDB operations need to maintain the proper context for n8n workflows:

```typescript
// Use the itemIndex parameter directly for single-item operations
// This ensures proper error context in n8n UI
throw new NodeOperationError(
  executeFunctions.getNode(),
  `Error message with context`,
  { itemIndex }
);

// For operations processing multiple items in a loop:
for (let i = 0; i < items.length; i++) {
  try {
    // Operation code
  } catch (error) {
    if (executeFunctions.continueOnFail()) {
      returnData.push({
        json: { error: error.message },
        pairedItem: { item: i },  // Use loop index for paired items
      });
      continue;
    }
    throw error;
  }
}
```

## Special Case: SurrealDB Return Type Inconsistencies

SurrealDB operations can return different types based on the operation type:

- `create` operations: Array of created records
- `select` operations: Single object for single record, array for multiple
- `query` operations: Result type depends on the query

Our approach handles these inconsistencies by:

1. **Validating response format**: Check the response structure before processing
2. **Standardizing output**: Convert all responses to a consistent format for n8n workflows
3. **Enhanced error detection**: Check for SurrealDB-specific error patterns in otherwise valid responses

## Best Practices for SurrealDB Error Handling in n8n

1. **Check for null, undefined, and empty objects** when validating SurrealDB responses
2. **Throw NodeOperationError with itemIndex** for record-specific errors
3. **Use continueOnFail pattern** consistently in all operations
4. **Provide specific error messages** that include the operation context (table name, record ID, etc.)
5. **Check both response format and content** for error detection

## Usage with continueOnFail

Users should enable continueOnFail in the node settings to:
- Route errors to the "error" output path (with continueOnFail disabled)
- Include error details along with successful operations in a single output path (with continueOnFail enabled)

## Example Workflow Pattern

```
[SurrealDB Node: Get Record] -> [IF: Has Error?] 
                                  -> True -> [Error Handling Path]
                                  -> False -> [Normal Processing Path]
```

When continueOnFail is enabled, the error details can be accessed using expressions like:
`{{ $json.error }}`

When continueOnFail is disabled, errors stop the workflow or trigger the error output.