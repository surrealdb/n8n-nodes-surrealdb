
# Remaining SurrealDB Node Operation Issues

This document serves as a checklist of remaining inconsistencies and issues in the SurrealDB node operations that need to be addressed.

## 1. Table Name Handling Inconsistencies

### 1.1. Inconsistent Table Name Cleaning
*** RESOLVED ***

## 2. Error Handling Inconsistencies

### 2.1. Inconsistent Error Result Creation
*** RESOLVED ***

### 2.2. Inconsistent Error Handling in Resource Handlers
*** RESOLVED ***

### 2.3. Nested Try-Catch Blocks
*** RESOLVED ***

## 3. Success Result Formatting Inconsistencies

### 3.1. Inconsistent Success Result Creation
*** RESOLVED ***

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

## 7. Response Transformation Issues

**General Issue**: Many operations transform SurrealDB's response data instead of returning it directly, adding unnecessary properties, custom messages, or restructuring the data.

**Principles for Refactoring**:
1. Return SurrealDB's data in its native format without transformation
2. Don't add "user-friendly" properties or restructure responses
3. Let SurrealDB's API design shine through our integration
4. Keep our code simple and focused on facilitating the interaction, not reimagining it
5. Ensure future compatibility by not making assumptions about response structures

**Remember**: We are providing a layer to allow n8n to interact with SurrealDB. We respect how SurrealDB does things.

** RESOLVED **

