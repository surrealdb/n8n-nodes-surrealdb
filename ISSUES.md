# SurrealDB Node Operation Issues

This document serves as a checklist of inconsistencies and issues in the SurrealDB node operations that need to be addressed.

## 1. Error Handling Inconsistencies

### 1.1. NodeOperationError Usage
- [ ] **File**: `/nodes/SurrealDb/resources/table/operations/mergeAllRecordsOperation.ts`
  - **Issue**: Uses plain `Error` instead of `NodeOperationError`
  - **Fix**: Replace all instances of `throw new Error()` with `throw new NodeOperationError(executeFunctions.getNode(), 'message', { itemIndex })`

### 1.2. ContinueOnFail Error Format
- [ ] **File**: `/nodes/SurrealDb/resources/field/operations/deleteField.operation.ts`
  - **Issue**: Returns `{ success: false }` format
  - **Fix**: Standardize to `{ json: { error: error.message }, pairedItem: { item: itemIndex } }`

- [ ] **File**: `/nodes/SurrealDb/resources/index/operations/createIndex.operation.ts`
  - **Issue**: Returns different error format
  - **Fix**: Standardize to same format as above

### 1.3. Nested Error Handling
- [ ] **File**: `/nodes/SurrealDb/resources/index/operations/createIndex.operation.ts`
  - **Issue**: Has nested try-catch blocks with different handling approaches
  - **Fix**: Consolidate into single try-catch block with standard format

### 1.4. Special Error Handling
- [ ] **File**: `/nodes/SurrealDb/resources/system/operations/healthCheck.operation.ts`
  - **Issue**: Uses non-standard error approach (returns successful response with unhealthy status)
  - **Fix**: Document as intentional exception OR standardize with other operations

## 2. Parameter Retrieval Inconsistencies

### 2.1. Credentials and Options Retrieval
- [ ] **File**: `/nodes/SurrealDb/resources/table/operations/mergeAllRecords.operation.ts`
  - **Issue**: Missing credentials retrieval and namespace/database options
  - **Fix**: Add standard credentials and options handling

### 2.2. Table Name Handling
- [ ] **File**: `/nodes/SurrealDb/resources/field/operations/createField.operation.ts`
  - **Issue**: Doesn't clean table name (if contains colon)
  - **Fix**: Add standard cleaning: 
    ```typescript
    if (table.includes(':')) {
      table = table.split(':')[0];
    }
    ```

### 2.3. DEBUG Flag Definition
- [ ] **File**: `/nodes/SurrealDb/resources/record/operations/updateRecord.operation.ts` (and others)
  - **Issue**: Missing DEBUG constant definition in some files
  - **Fix**: Add `const DEBUG = false;` to all operation files

### 2.4. Parameter Validation Approach
- [ ] **Files**: Multiple operations
  - **Issue**: Mix of `validateRequiredField()` and manual checks
  - **Fix**: Use `validateRequiredField()` consistently for all required parameters

## 3. Return Data Formatting Issues

### 3.1. Success Response Structures
- [ ] **File**: `/nodes/SurrealDb/resources/field/operations/deleteField.operation.ts`
  - **Issue**: Returns `{ success: true, ... }` format
  - **Fix**: Standardize success response structure

- [ ] **File**: `/nodes/SurrealDb/resources/index/operations/dropIndex.operation.ts`
  - **Issue**: Different response format
  - **Fix**: Match standard format

### 3.2. Formatting Utilities Usage
- [ ] **File**: `/nodes/SurrealDb/resources/table/operations/deleteAllRecords.operation.ts`
  - **Issue**: Inconsistent use of `formatArrayResult`
  - **Fix**: Use formatting utilities consistently

- [ ] **File**: `/nodes/SurrealDb/resources/system/operations/healthCheck.operation.ts`
  - **Issue**: Doesn't use formatting utilities
  - **Fix**: Implement standard formatters

### 3.3. Empty Result Handling
- [x] **File**: `/nodes/SurrealDb/resources/table/operations/mergeAllRecords.operation.ts`
  - **Issue**: Adds "No records affected" message when empty instead of returning an empty array
  - **Fix**: Remove special case handling, return empty array when no results

- [ ] **File**: `/nodes/SurrealDb/resources/query/operations/executeQuery.operation.ts`
  - **Issue**: Adds empty result object when no results are found
  - **Fix**: Return empty array when no results are found

- [ ] **File**: `/nodes/SurrealDb/resources/field/operations/listFields.operation.ts`
  - **Issue**: Returns message when no fields found instead of empty array
  - **Fix**: Return empty array when no results are found

- [ ] **File**: `/nodes/SurrealDb/resources/index/operations/listIndexes.operation.ts`
  - **Issue**: Returns message when no indexes found instead of empty array
  - **Fix**: Return empty array when no results are found

- [ ] **File**: `/nodes/SurrealDb/resources/table/operations/listTables.operation.ts`
  - **Issue**: Returns various messages for empty results instead of empty array
  - **Fix**: Return empty array when no results are found

- [ ] **File**: `/nodes/SurrealDb/resources/table/operations/getAllRecords.operation.ts`
  - **Issue**: Returns empty array
  - **Fix**: Ensure consistent approach to empty results

## 4. PairedItem Implementation Issues

### 4.1. PairedItem Location
- [ ] **Files**: Various operations in field and index resources
  - **Issue**: PairedItem sometimes inside json property
  - **Fix**: Ensure pairedItem is always at root level:
    ```typescript
    return [{
      json: { result },
      pairedItem: { item: itemIndex },
    }];
    ```

### 4.2. PairedItem in Array Returns
- [ ] **Files**: Multiple operations
  - **Issue**: Inconsistent pairedItem application in array returns
  - **Fix**: Ensure all array results have proper pairedItem:
    ```typescript
    const returnData = formattedResults.map(formattedResult => ({
      ...formattedResult,
      pairedItem: { item: itemIndex },
    }));
    ```

## 5. ItemIndex Handling Issues

### 5.1. ItemIndex in Error Objects
- [ ] **File**: `/nodes/SurrealDb/resources/table/operations/mergeAllRecords.operation.ts`
  - **Issue**: Missing itemIndex in error objects
  - **Fix**: Add `{ itemIndex }` to all NodeOperationError constructors

### 5.2. ItemIndex in Debug Logs
- [ ] **Files**: Multiple operations
  - **Issue**: Inconsistent inclusion of itemIndex in debug logs
  - **Fix**: Standardize debug logging to include itemIndex

## 6. Operation Pattern Inconsistencies

### 6.1. Query Building
- [ ] **Files**: Various field, index, and table operations
  - **Issue**: Different patterns for building SurrealQL queries
  - **Fix**: Create helper functions for common query patterns

### 6.2. Result Error Checking
- [ ] **File**: `/nodes/SurrealDb/resources/index/operations/createIndex.operation.ts`
  - **Issue**: Special logic for error checking in results
  - **Fix**: Standardize result error checking across operations

### 6.3. Credential Handling
- [ ] **Files**: Multiple operations
  - **Issue**: Inconsistent use of `prepareSurrealQuery`
  - **Fix**: Ensure all query operations use this consistently

## 7. Other Inconsistencies

### 7.1. ReturnData Array Usage
- [ ] **Files**: Multiple operations
  - **Issue**: Different approaches to returnData array creation/usage
  - **Fix**: Standardize pattern for handling result data

### 7.2. DEBUG Logging Patterns
- [ ] **Files**: All operations
  - **Issue**: Varying debug log formats
  - **Fix**: Create standard debug logging pattern

### 7.3. JSON Validation
- [ ] **Files**: Operations accepting JSON data
  - **Issue**: Different validation approaches
  - **Fix**: Standardize JSON validation

### 7.4. Type Handling
- [ ] **Files**: Multiple operations
  - **Issue**: Inconsistent type checking and casting
  - **Fix**: Create standard helpers for type validation

## How to Use This Checklist

1. Review each issue listed
2. Create a branch for addressing the issues
3. Fix the issues by category for consistency
4. Mark off items by replacing `[ ]` with `[x]` as they're completed
5. Create unit tests to verify fixes
6. Submit a PR with the changes