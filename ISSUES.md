# Remaining SurrealDB Node Operation Issues

This document serves as a checklist of remaining inconsistencies and issues in the SurrealDB node operations that need to be addressed.

## 1. Table Name Handling Inconsistencies

### 1.1. Inconsistent Table Name Cleaning
*** RESOLVED ***

## 2. Error Handling Inconsistencies

### 2.1. Inconsistent Error Result Creation
*** RESOLVED ***

### 2.2. Inconsistent Error Handling in Resource Handlers
- **Files**: Some resource handler files handle errors differently than others
  - **Issue**: Some handlers (query, system, record, table) handle errors at the handler level with continueOnFail logic, while others (field, index) delegate error handling to the operations with a comment: "Don't handle errors here, let the operations handle them. This is to avoid double-handling of errors."
  - **Fix**: Standardize all resource handlers to use the same approach - delegate error handling to operations to avoid double-handling:

    ```typescript
    // CURRENT INCONSISTENT APPROACH IN SOME HANDLERS:
    try {
        // Operation execution
    } catch (error) {
        if (executeFunctions.continueOnFail()) {
            returnData.push(createErrorResult(error, i));
            continue;
        }
        throw error;
    }

    // STANDARDIZED APPROACH FOR ALL HANDLERS:
    try {
        // Operation execution
    } catch (error) {
        // Don't handle errors here, let the operations handle them
        // This is to avoid double-handling of errors
        throw error;
    }
    ```

    **Guidelines**:
    - All resource handlers should delegate error handling to their operations
    - All operations must properly handle errors with continueOnFail using addErrorResult()
    - Add the explanatory comment to all handlers for clarity

    **Files to Fix**:

    ## Resource Handler Files (Need to delegate error handling)
    1. nodes/SurrealDb/resources/query/query.handler.ts
    2. nodes/SurrealDb/resources/system/system.handler.ts
    3. nodes/SurrealDb/resources/record/record.handler.ts
    4. nodes/SurrealDb/resources/table/table.handler.ts

### 2.3. Nested Try-Catch Blocks
- **Files**: listIndexes.operation.ts and others
  - **Issue**: Some operations have nested try-catch blocks with different error handling approaches
  - **Fix**: Consolidate try-catch blocks where possible:
    ```typescript
    // Replace nested try-catch blocks:
    try {
        try {
            // Operation logic
        } catch (innerError) {
            // Inner error handling
        }
    } catch (outerError) {
        // Outer error handling
    }

    // With a single try-catch block:
    try {
        // Operation logic
    } catch (error) {
        // Unified error handling
    }
    ```
  - **Note**: For operations like version.operation.ts where nested try-catch is used for fallback logic, add clear comments explaining the purpose.

## 3. Success Result Formatting Inconsistencies

### 3.1. Inconsistent Success Result Creation
- **Files**: deleteField.operation.ts, healthCheck.operation.ts, version.operation.ts, and others
  - **Issue**: Some operations manually create success result objects while others use utility functions
  - **Fix**: Standardize all success result creation to use the utility functions:
    ```typescript
    // Replace this:
    returnData.push({
        json: {
            result: {
                field: fieldName,
                table,
                message: `Field ${fieldName} has been deleted from table ${table}`
            }
        },
        pairedItem: { item: itemIndex },
    });

    // With this:
    addSuccessResult(returnData, {
        field: fieldName,
        table,
        message: `Field ${fieldName} has been deleted from table ${table}`
    }, itemIndex);
    ```

### 3.2. Inconsistent Return Data Structure
- **Files**: System operations (healthCheck.operation.ts, version.operation.ts)
  - **Issue**: Different return data structures across operations
  - **Fix**: Standardize return data structure to consistently use the `result` property wrapper:
    ```typescript
    // Replace this (in version.operation.ts):
    return [{
        json: {
            version,
            details,
        },
        pairedItem: { item: itemIndex },
    }];

    // With this:
    return [{
        json: {
            result: {
                version,
                details,
            }
        },
        pairedItem: { item: itemIndex },
    }];
    ```

## 4. Debug Logging Inconsistencies

### 4.1. Inconsistent Debug Logging Patterns
- **Files**: rebuildIndex.operation.ts and some older operations
  - **Issue**: Some operations use direct console.log calls instead of the debugLog utility function
  - **Fix**: Replace all direct console.log calls with the debugLog utility function:
    ```typescript
    // Replace this:
    if (DEBUG) {
        console.log('DEBUG - Operation: message', data);
    }

    // With this:
    if (DEBUG) debugLog('operation', 'message', itemIndex, data);
    ```

## 5. Credentials Handling Inconsistencies

### 5.1. Inconsistent Credentials Object Creation
- **Files**: healthCheck.operation.ts and some older operations
  - **Issue**: Some operations manually build the credentials object while others use the utility function
  - **Fix**: Standardize all operations to use the buildCredentialsObject utility function:
    ```typescript
    // Replace this:
    const resolvedCredentials: ISurrealCredentials = {
        connectionString: credentials.connectionString as string,
        authentication: credentials.authentication as 'Root' | 'Namespace' | 'Database',
        username: credentials.username as string,
        password: credentials.password as string,
        namespace: nodeNamespace || (credentials.namespace as string),
        database: nodeDatabase || (credentials.database as string),
    };

    // With this:
    const resolvedCredentials = buildCredentialsObject(credentials, options);
    ```

## 6. Empty Result Handling Inconsistencies

### 6.1. Missing Empty Result Handling
- **File**: `/nodes/SurrealDb/resources/query/operations/executeQuery.operation.ts`
  - **Issue**: Has a comment about handling empty results but doesn't implement it consistently
  - **Fix**: Implement consistent empty result handling:
    ```typescript
    // Add after processing all results:
    if (returnData.length === 0) {
        // Return empty array for consistency with other operations
        // No need to add an empty placeholder item
    }
    ```

## 7. Special Cases

### 7.1. Special Error Handling in healthCheck.operation.ts
*** RESOLVED ***
    ```

