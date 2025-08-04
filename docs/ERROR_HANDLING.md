# Enhanced Error Handling & Recovery System

## Overview

The SurrealDB n8n node now includes a comprehensive error handling and recovery system that provides:

- **Automatic Error Classification**: Categorizes errors by type and severity
- **Intelligent Retry Logic**: Exponential backoff with configurable retry strategies
- **Connection Recovery**: Automatic reconnection and re-authentication
- **Enhanced Error Reporting**: Detailed error information with context
- **Operation-Specific Configurations**: Different error handling strategies for different operation types

## Error Categories

The system classifies errors into the following categories:

### Connection & Network Errors
- **CONNECTION_ERROR**: Network connectivity issues, connection refused, etc.
- **TIMEOUT_ERROR**: Request timeouts, deadline exceeded
- **AUTHENTICATION_ERROR**: Invalid credentials, unauthorized access

### Query & Data Errors
- **QUERY_SYNTAX_ERROR**: Malformed queries, syntax errors
- **VALIDATION_ERROR**: Invalid data, missing required fields
- **DATA_TYPE_ERROR**: Type mismatches, conversion errors

### Permission & Access Errors
- **PERMISSION_ERROR**: Insufficient privileges, access denied
- **RESOURCE_NOT_FOUND**: Tables, records, or resources not found

### System & Infrastructure Errors
- **SYSTEM_ERROR**: Internal server errors, database errors
- **RATE_LIMIT_ERROR**: Too many requests, throttling
- **UNKNOWN_ERROR**: Unclassified errors

## Error Severity Levels

- **LOW**: Non-critical errors that don't affect core functionality
- **MEDIUM**: Moderate errors that may impact some operations
- **HIGH**: Serious errors that affect multiple operations
- **CRITICAL**: Fatal errors that require immediate attention

## Configuration

### Default Error Configuration

```typescript
const DEFAULT_ERROR_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,        // 1 second
  maxDelay: 30000,        // 30 seconds
  backoffMultiplier: 2,   // Exponential backoff
  retryableErrors: [
    ErrorCategory.CONNECTION_ERROR,
    ErrorCategory.TIMEOUT_ERROR,
    ErrorCategory.RATE_LIMIT_ERROR,
    ErrorCategory.SYSTEM_ERROR,
  ],
  enableConnectionRecovery: true,
  enableQueryValidation: true,
  logErrorDetails: true,
};
```

### Operation-Specific Configurations

The system automatically selects appropriate error handling based on operation type:

#### Read Operations (Query, Select, Get)
- Fewer retries (2)
- Faster retry delays (500ms base)
- Continue on low/medium severity errors

#### Write Operations (Create, Update, Delete)
- More retries (3)
- Standard delays (1000ms base)
- Stop on medium+ severity errors

#### Critical Operations (Schema, Auth, Connect)
- Minimal retries (1)
- Longer delays (2000ms base)
- Stop on any error

#### Bulk Operations (Batch, Many)
- Moderate retries (2)
- Medium delays (1500ms base)
- Handle rate limiting

## Recovery Strategies

### RETRY_ONLY
- Simple retry with exponential backoff
- No additional recovery attempts

### CONNECTION_RECOVERY
- Attempt to reconnect and re-authenticate
- Validate connection health
- Retry the operation

### VALIDATION_RETRY
- Retry with validation checks
- Useful for data validation errors

### FULL_RECOVERY
- Combination of connection and validation recovery
- Most comprehensive recovery approach

## Usage Examples

### Basic Error Handling

```typescript
import { executeWithErrorHandling } from './errorWrapper';

const result = await executeWithErrorHandling(
  async () => {
    return await client.query("SELECT * FROM users");
  },
  {
    operationName: "executeQuery",
    itemIndex: 0,
    credentials: resolvedCredentials,
    additionalContext: {
      query: "SELECT * FROM users",
    },
  },
  executeFunctions,
  client,
);
```

### Enhanced Query Execution

```typescript
import { executeQueryWithEnhancedErrorHandling } from './errorWrapper';

const result = await executeQueryWithEnhancedErrorHandling(
  client,
  "SELECT * FROM users WHERE age > $min_age",
  credentials,
  {
    operationName: "executeQuery",
    itemIndex: 0,
    additionalContext: {
      parameters: ["min_age"],
    },
  },
  executeFunctions,
  { min_age: 18 },
);
```

### Record Operations

```typescript
import { executeRecordOperationWithErrorHandling } from './errorWrapper';

const result = await executeRecordOperationWithErrorHandling(
  async () => {
    return await client.create("users", { name: "John", age: 30 });
  },
  {
    operationName: "createRecord",
    itemIndex: 0,
    additionalContext: {
      table: "users",
      dataKeys: ["name", "age"],
    },
  },
  executeFunctions,
  client,
);
```

## Error Result Format

When `continueOnFail` is enabled, errors are returned in this format:

```json
{
  "error": {
    "message": "Connection timeout",
    "category": "TIMEOUT_ERROR",
    "severity": "MEDIUM",
    "retryable": true,
    "context": {
      "operation": "executeQuery",
      "itemIndex": 0,
      "timestamp": "2024-01-15T10:30:00Z",
      "query": "SELECT * FROM users...",
      "recoveryStrategy": "CONNECTION_RECOVERY",
      "recoveryAttempts": 1
    }
  }
}
```

## Debugging

Enable debug logging to see detailed error handling information:

```typescript
// Set DEBUG to true in debug.ts
export const DEBUG = true;
```

Debug output includes:
- Error classification details
- Retry attempts and delays
- Recovery strategy selection
- Connection recovery attempts
- Final error handling decisions

## Customization

### Custom Error Configuration

```typescript
import { getErrorConfig } from './errorConfig';

// Override default configuration
const customConfig = {
  ...getErrorConfig("executeQuery"),
  maxRetries: 5,
  baseDelay: 2000,
  retryableErrors: [
    ErrorCategory.CONNECTION_ERROR,
    ErrorCategory.TIMEOUT_ERROR,
  ],
};
```

### Custom Recovery Strategy

```typescript
import { RecoveryStrategy } from './errorConfig';

function getCustomRecoveryStrategy(errorCategory: ErrorCategory, operationType: string): RecoveryStrategy {
  // Custom logic for recovery strategy selection
  if (operationType === "criticalOperation" && errorCategory === ErrorCategory.CONNECTION_ERROR) {
    return RecoveryStrategy.FULL_RECOVERY;
  }
  return RecoveryStrategy.RETRY_ONLY;
}
```

## Best Practices

### 1. Use Appropriate Operation Names
Choose descriptive operation names that help the system select the right error configuration:
- `executeQuery` for read operations
- `createRecord`, `updateRecord` for write operations
- `connectSurrealClient` for connection operations

### 2. Provide Context
Include relevant context in `additionalContext` to help with debugging:
```typescript
additionalContext: {
  table: "users",
  operation: "bulk_insert",
  recordCount: 1000,
}
```

### 3. Handle Specific Error Categories
Check error categories in your error handling logic:
```typescript
if (result.json.error?.category === ErrorCategory.AUTHENTICATION_ERROR) {
  // Handle authentication issues specifically
}
```

### 4. Monitor Error Patterns
Use the enhanced error information to identify patterns:
- High retry counts may indicate connection issues
- Validation errors may indicate data quality problems
- Rate limit errors may require throttling

## Migration Guide

### From Basic Error Handling

**Before:**
```typescript
try {
  const result = await client.query(query);
  return { json: result };
} catch (error) {
  if (executeFunctions.continueOnFail()) {
    return { json: { error: error.message } };
  }
  throw error;
}
```

**After:**
```typescript
return await executeQueryWithEnhancedErrorHandling(
  client,
  query,
  credentials,
  { operationName: "executeQuery", itemIndex: 0 },
  executeFunctions,
);
```

### Benefits of Migration

1. **Automatic Retry**: No need to implement retry logic manually
2. **Connection Recovery**: Automatic reconnection on connection errors
3. **Better Error Information**: Detailed error categorization and context
4. **Consistent Error Handling**: Standardized approach across all operations
5. **Configurable Behavior**: Different strategies for different operation types

## Troubleshooting

### Common Issues

1. **Too Many Retries**: Adjust `maxRetries` in error configuration
2. **Slow Recovery**: Reduce `baseDelay` and `maxDelay` values
3. **Connection Issues**: Check `enableConnectionRecovery` setting
4. **Missing Error Context**: Ensure `additionalContext` is provided

### Debug Information

Enable debug logging to see:
- Error classification process
- Retry attempt details
- Recovery strategy selection
- Connection recovery attempts
- Final error handling decisions

### Performance Considerations

- Retry delays use exponential backoff to avoid overwhelming the server
- Connection recovery is only attempted for connection-related errors
- Error classification is lightweight and doesn't impact performance
- Debug logging can be disabled in production

## Future Enhancements

Planned improvements include:
- Circuit breaker pattern for repeated failures
- Adaptive retry strategies based on error patterns
- Metrics collection for error rates and recovery success
- Integration with external monitoring systems
- Custom error handlers for specific error types 