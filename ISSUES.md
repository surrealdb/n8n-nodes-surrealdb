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

## 7. Response Transformation Issues

**General Issue**: Many operations transform SurrealDB's response data instead of returning it directly, adding unnecessary properties, custom messages, or restructuring the data.

**Principles for Refactoring**:
1. Return SurrealDB's data in its native format without transformation
2. Don't add "user-friendly" properties or restructure responses
3. Let SurrealDB's API design shine through our integration
4. Keep our code simple and focused on facilitating the interaction, not reimagining it
5. Ensure future compatibility by not making assumptions about response structures

**Remember**: We are providing a layer to allow n8n to interact with SurrealDB. We respect how SurrealDB does things.

### 7.1. Inconsistent Result Handling in List Fields Operation
- **File**: nodes/SurrealDb/resources/field/operations/listFields.operation.ts
  - **Issue**: The List Fields operation adds unnecessary properties and restructures the field information instead of simply returning the field data from SurrealDB
  - **Fix**: Return just the field information directly from the SurrealDB response:
    ```typescript
    // Replace this complex code:
    if (tableInfo.fields && typeof tableInfo.fields === 'object') {
        // Convert the fields object to a more user-friendly format
        const fieldsArray = Object.entries(tableInfo.fields).map(([fieldName, definition]) => {
            // Process the field definition to extract type, constraints, etc.
            const definitionStr = definition as string;

            // Extract field type
            const typeMatch = definitionStr.match(/TYPE\s+(\S+)/i);
            const fieldType = typeMatch ? typeMatch[1] : 'unknown';

            // Check if field is computed (has VALUE keyword)
            const isComputed = definitionStr.includes(' VALUE ');

            // Check for READONLY attribute
            const isReadOnly = definitionStr.includes(' READONLY');

            // Check for FLEXIBLE attribute
            const isFlexible = definitionStr.includes(' FLEXIBLE');

            // Extract permissions
            const permissionsMatch = definitionStr.match(/PERMISSIONS\s+(\S+)/i);
            const permissions = permissionsMatch ? permissionsMatch[1] : 'unknown';

            return {
                name: fieldName,
                type: fieldType,
                definition: definitionStr,
                isComputed,
                isReadOnly,
                isFlexible,
                permissions,
            };
        });

        // Add each field as a separate item in the returnData for better n8n integration
        for (const field of fieldsArray) {
            returnData.push({
                json: {
                    success: true,
                    table,
                    name: field.name,
                    type: field.type,
                    definition: field.definition,
                    isComputed: field.isComputed,
                    isReadOnly: field.isReadOnly,
                    isFlexible: field.isFlexible,
                    permissions: field.permissions,
                    totalFields: fieldsArray.length
                },
                pairedItem: { item: itemIndex },
            });
        }
    }

    // With this simple approach that just returns the field information:
    if (tableInfo.fields && typeof tableInfo.fields === 'object') {
        returnData.push({
            json: tableInfo.fields,
            pairedItem: { item: itemIndex },
        });
    }
    ```
  - **Note**: This operation should simply return the field information from the SurrealDB response without adding any extra properties or restructuring. This ensures we're returning exactly what SurrealDB provides.

### 7.2. Custom Success Message in Create Table Operation
- **File**: nodes/SurrealDb/resources/table/operations/createTable.operation.ts
  - **Issue**: Returns a custom success message instead of the SurrealDB response
  - **Fix**: Return the SurrealDB response directly:
    ```typescript
    // Replace this:
    returnData.push({
        json: {
            success: true,
            table,
            message: `Table ${table} created successfully.`,
        },
        pairedItem: { item: itemIndex },
    });

    // With this:
    returnData.push({
        json: result,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.3. Custom Success Message in Delete Table Operation
- **File**: nodes/SurrealDb/resources/table/operations/deleteTable.operation.ts
  - **Issue**: Returns a custom success message instead of the SurrealDB response
  - **Fix**: Return the SurrealDB response directly:
    ```typescript
    // Replace this:
    returnData.push({
        json: {
            success: true,
            table,
            message: `Table ${table} deleted successfully.`,
        },
        pairedItem: { item: itemIndex },
    });

    // With this:
    returnData.push({
        json: result,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.4. Custom Success Message in Rebuild Index Operation
- **File**: nodes/SurrealDb/resources/index/operations/rebuildIndex.operation.ts
  - **Issue**: Returns a custom success message instead of the SurrealDB response
  - **Fix**: Return the SurrealDB response directly:
    ```typescript
    // Replace this:
    returnData.push({
        json: {
            success: true,
            index: indexName,
            table,
            message: `Index ${indexName} has been rebuilt on table ${table}`
        },
        pairedItem: { item: itemIndex },
    });

    // With this:
    returnData.push({
        json: result,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.5. Custom Structure in Get Table Operation
- **File**: nodes/SurrealDb/resources/table/operations/getTable.operation.ts
  - **Issue**: Wraps the table definition in a custom structure with success flag
  - **Fix**: Return the table information directly:
    ```typescript
    // Replace this:
    returnData.push({
        json: {
            success: true,
            table,
            definition: tableInfo,
            message: `Retrieved definition for table ${table}`
        },
        pairedItem: { item: itemIndex },
    });

    // With this:
    returnData.push({
        json: tableInfo,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.6. Custom Properties in Describe Index Operation
- **File**: nodes/SurrealDb/resources/index/operations/describeIndex.operation.ts
  - **Issue**: Adds custom properties to the index information
  - **Fix**: Return the index information directly:
    ```typescript
    // Replace this:
    returnData.push({
        json: {
            success: true,
            table,
            name: indexName,
            isBuilding,
            ...(buildingProgress && { buildingProgress }),
            details: indexInfo,
            message: `Retrieved details for index ${indexName} on table ${table}`
        },
        pairedItem: { item: itemIndex },
    });

    // With this:
    returnData.push({
        json: indexInfo,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.7. Custom Success Message in Create Index Operation
- **File**: nodes/SurrealDb/resources/index/operations/createIndex.operation.ts
  - **Issue**: Returns a custom success message instead of the SurrealDB response
  - **Fix**: Return the SurrealDB response directly:
    ```typescript
    // Replace this:
    addSuccessResult(returnData, {
        index: indexName,
        table,
        fields: fieldsList,
        type: indexType,
        unique: options.isUnique === true,
        message: `Index ${indexName} created on table ${table}`
    }, itemIndex);

    // With this:
    returnData.push({
        json: result,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.8. Custom Success Message in Merge Record Operation
- **File**: nodes/SurrealDb/resources/record/operations/mergeRecord.operation.ts
  - **Issue**: Adds a custom success message when result is empty
  - **Fix**: Return the SurrealDB response directly:
    ```typescript
    // Replace this:
    if (typeof result === 'object' && Object.keys(result).length === 0) {
        // After merge, fetch the complete record to return
        const updatedRecord = await client.select(recordId);

        if (updatedRecord === null || updatedRecord === undefined) {
            // This shouldn't happen if merge succeeded, but just in case
            addSuccessResult(returnData, {
                success: true,
                message: `Record ${recordId.toString()} was merged successfully but couldn't be retrieved.`
            }, itemIndex);
        } else {
            // Return the updated record
            addSuccessResult(returnData, updatedRecord, itemIndex);
        }
    } else {
        // Add the result to return data
        addSuccessResult(returnData, result, itemIndex);
    }

    // With this:
    returnData.push({
        json: result,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.9. Custom Message in Create Record Operation
- **File**: nodes/SurrealDb/resources/record/operations/createRecord.operation.ts
  - **Issue**: Adds a custom message when result is null/undefined
  - **Fix**: Return the SurrealDB response directly:
    ```typescript
    // Replace this:
    if (result) {
        // Format the result
        const formattedResult = formatSingleResult(result);
        returnData.push({
            ...formattedResult,
            pairedItem: { item: itemIndex },
        });
    } else {
        // If result is null/undefined but no exception was thrown, return an empty result
        if (DEBUG) debugLog('createRecord', 'Null/undefined result, but no exception thrown', itemIndex);
        addSuccessResult(returnData, {
            message: 'Record created but no data returned',
            table,
        }, itemIndex);
    }

    // With this:
    returnData.push({
        json: result || null,
        pairedItem: { item: itemIndex },
    });
    ```

### 7.10. Result Wrapping in Utility Functions
- **File**: nodes/SurrealDb/utilities.ts
  - **Issue**: The `addSuccessResult()` and `createSuccessResult()` functions wrap data in a `result` property
  - **Fix**: Modify these functions to not wrap the data:
    ```typescript
    // Replace this:
    export function createSuccessResult(data: Record<string, any>, itemIndex: number): INodeExecutionData {
        return {
            json: {
                result: data
            },
            pairedItem: { item: itemIndex }
        };
    }

    // With this:
    export function createSuccessResult(data: Record<string, any>, itemIndex: number): INodeExecutionData {
        return {
            json: data,
            pairedItem: { item: itemIndex }
        };
    }
    ```

