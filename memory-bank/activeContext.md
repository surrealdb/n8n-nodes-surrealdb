# Active Context: n8n-nodes-surrealdb

## Current Work Focus

The current focus is on rewriting the credentials part of the node from scratch to simplify it and align with standard n8n credential testing. The node is functional to a point but needs significant work to properly align the operations and UI with expectations.

### Key Areas of Focus

1. **Credentials Rewrite**: Rewriting the credential definition and handling logic from scratch to simplify it and support standard n8n credential testing.

2. **Resource-Based Organization**: Restructuring the node to organize functionality by resources (Record, Table, Query, System) as specified in the PRD.

3. **Operation Implementation**: Implementing all required operations for each resource, ensuring they follow the specifications in the PRD.

4. **Input Validation**: Enhancing input validation to provide better error messages and prevent invalid operations.

5. **Output Transformation**: Standardizing output formatting across all operations for consistency.

6. **Error Handling**: Improving error handling to provide more descriptive error messages.

## Recent Changes

1. **Refactoring Plan**: Created a comprehensive refactoring plan (PLAN.md) that outlines the steps to align the node with the PRD requirements.

2. **Memory Bank Initialization**: Set up the Memory Bank documentation structure to maintain project knowledge.

3. **Phase 1 Implementation**: Completed Phase 1 of the refactoring plan:
   - Added RecordId utility function (`createRecordId`)
   - Added input validation functions (`validateJSON`, `validateRequiredField`, `validateNumericField`, `validateArrayField`)
   - Added output transformation functions (`formatSingleResult`, `formatArrayResult`)

4. **Test Implementation**: Modified existing operations to test the new utility functions:
   - Updated the query operation to use `validateJSON`, `validateRequiredField`, and `formatSingleResult`/`formatArrayResult`
   - Added parameters support to the query operation
   - Updated the update operation to use `validateRequiredField` and `createRecordId`

5. **Code Quality Improvements**:
   - Removed unused imports and variables
   - Verified system operations (health check and version) functionality
   - Resolved all TypeScript compiler warnings
6. **Bug Fixes**: 
   - Debugged and fixed the `getAllRecords` operation to correctly process results from `client.query`.
   - Debugged and fixed the `createMany` operation to use `client.insert()` instead of an incorrect `client.query()` call.
   - Debugged and fixed the `getMany` operation, confirming that interpolating Record IDs directly into the `WHERE id IN [...]` clause is the correct approach.
7. **Testing**: Confirmed `getAllRecords`, `createMany`, `getMany`, `executeQuery`, and `version` operations are working correctly after fixes.
8. **Namespace/Database Overrides**: Implemented optional Namespace and Database overrides: Added UI fields ("Namespace", "Database") in `SurrealDbProperties.ts`, retrieved values in `SurrealDb.node.ts`, and updated `validateAndResolveSurrealCredentials` in `GenericFunctions.ts` to prioritize overrides. Moved the "Advanced Options" block containing these fields to the end of the node properties list for better UI layout.

## Next Steps

According to the refactoring plan and recent discussion, the next steps are:

### Phase 1: Preparation and Infrastructure (Completed)

1. **Create RecordId Utility Function (Completed)**
   - Added a utility function to handle the creation of record ID strings
   - Implemented as `createRecordId(table, id)` in utilities.ts
   - Returns a string in the format "table:id"

2. **Enhance Input Validation (Completed)**
   - Added JSON validation function (`validateJSON`)
   - Added required field validation function (`validateRequiredField`)
   - Added numeric field validation function (`validateNumericField`)
   - Added array validation function (`validateArrayField`)
   - All validation functions implemented in GenericFunctions.ts

3. **Standardize Output Transformation (Completed)**
   - Added helper function for single result formatting (`formatSingleResult`)
   - Added helper function for array result formatting (`formatArrayResult`)
   - Both functions implemented in utilities.ts

### Phase 2: Resource-Based Restructuring (Completed)

4. **Implement Record Resource Operations (Completed)**
   - Added Create operation (refactored existing create)
   - Added Get operation
   - Added Update operation (refactored existing update)
   - Added Merge operation
   - Added Delete operation (refactored existing delete)
   - Added Upsert operation
   - All operations implemented and working correctly

5. **Implement Table Resource Operations (Completed)**
   - Added Get All Records operation (refactored existing select)
   - Added Create Many operation
   - Added Get Many operation
   - All operations implemented and working correctly

6. **Implement Query Resource Operations (Completed)**
   - Refactored existing query operation
   - Added pagination support
   - Improved array result handling

7. **Implement System Resource Operations (Completed)**
   - Added Health Check operation using n8n's httpRequest helper
   - Added Version operation with fallback mechanism
   - Both operations implemented with proper error handling

### Phase 3: UI and UX Improvements (In Progress)

1. **Update Node Properties & Fixes (Completed)**: Refined existing properties (`SurrealDbProperties.ts`) and fixed related bugs in Table operations (`getAllRecords`, `createMany`, `getMany` in `SurrealDb.node.ts`).
2. **Add Optional Namespace/Database Overrides (Completed)**: Added optional fields ("Namespace", "Database") to the node UI allowing users to specify a Namespace and Database for an operation, overriding the credential settings. Updated `SurrealDbProperties.ts`, `SurrealDb.node.ts`, and `GenericFunctions.ts`. Moved the "Advanced Options" block containing these fields to the end of the property list for better UI layout.
3. **Rewrite Credentials (In Progress)**: Rewriting the credential definition and handling logic from scratch to simplify it and align with standard n8n credential testing. This involves:
    - Defining the new credential fields (Connection String, Authentication, Username, Password, Namespace, Database) with appropriate visibility rules.
    - Ensuring only HTTP/HTTPS protocols are supported.
    - Implementing the standard n8n credential testing method.
    - Updating type definitions and connection functions to work with the new credential structure.
4. **Enhance Error Handling**: Review and improve error handling messages and consistency across all operations in `SurrealDb.node.ts`.

## Active Decisions and Considerations

1. **Incremental Approach**: The refactoring will be done in small, incremental steps to minimize the risk of breaking existing functionality. Each step will be tested before moving on to the next.

2. **Credentials Rewrite**: The credentials will be rewritten from scratch to simplify the connection options to HTTP/HTTPS only and enable standard n8n credential testing. This approach:
   - Simplifies the code and reduces potential issues
   - Aligns with n8n credential testing standards
   - Provides a more robust connection testing mechanism
   - Makes the code easier to maintain and update

3. **RecordId Handling**: The current implementation doesn't use the RecordId class from the SurrealDB SDK. We need to determine the correct approach for handling record IDs based on the SDK documentation.

4. **Backward Compatibility**: While refactoring, we need to ensure that existing functionality continues to work. This may require maintaining some backward compatibility code during the transition.

5. **Testing Strategy**: Each change will be tested to ensure it works correctly. We'll need to develop a testing strategy that covers all operations and edge cases.

6. **Documentation**: As we refactor, we'll need to update the documentation to reflect the new structure and functionality.

## Important Patterns and Preferences

1. **Code Organization**: Keep related functionality together and use clear, descriptive names for functions and variables.

2. **Error Handling**: Use NodeOperationError with descriptive messages and include the item index where applicable.

3. **Input Validation**: Validate all inputs before performing operations to prevent errors and provide helpful feedback.

4. **Output Formatting**: Follow consistent output formatting patterns for all operations.

5. **Connection Management**: Establish connections at the beginning of execution and close them in a finally block to ensure cleanup.
6. **`client.query` Result Processing**: When processing results from `client.query` for a single `SELECT` statement, check `Array.isArray(result) && result.length > 0 && Array.isArray(result[0])` and access the records via `result[0]`. Use appropriate generic types (e.g., `<[any[]]>`) with `client.query` to ensure type safety.
7. **`WHERE id IN [...]` Queries**: When using `client.query` with a `WHERE id IN [...]` clause, interpolating the list of full Record IDs directly into the query string (e.g., `WHERE id IN [table:id1,table:id2]`) is necessary. Parameterizing the array of IDs (e.g., `WHERE id IN $ids`) does not seem to work correctly with the current SDK version/behavior.

## Learnings and Project Insights

1. **SurrealDB SDK Usage**: The SurrealDB SDK provides a clean, intuitive API for interacting with SurrealDB. However, it requires proper handling of record IDs and connection management. 
   - The `client.query` method returns an array of results, one for each statement. For a single `SELECT` statement, the result is an array containing one element, which is the array of records (e.g., `result[0]` contains the records). Providing a generic type like `<[any[]]>` helps TypeScript understand this structure.
   - The `client.insert()` method correctly handles inserting an array of records for bulk creation.
   - Parameterizing arrays of Record IDs for `WHERE id IN $ids` clauses in `client.query` does not seem to work; direct interpolation of the Record ID list into the query string is required for this specific case.

2. **n8n Node Development**: n8n provides a flexible framework for node development, but it requires careful attention to input/output formatting and error handling.

3. **Resource-Based Organization**: Organizing node functionality by resources provides a clear, intuitive structure for users and aligns with database concepts.

4. **Incremental Refactoring**: Breaking down a large refactoring task into small, incremental steps makes it more manageable and reduces the risk of breaking existing functionality.
