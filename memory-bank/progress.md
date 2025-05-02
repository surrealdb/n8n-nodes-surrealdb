# Progress: n8n-nodes-surrealdb

## Current Status

The SurrealDB node is currently in a partially functional state. It provides basic connectivity to SurrealDB and implements some core operations, but it needs significant refactoring to align with the requirements specified in the PRD.

### What Works

1. **Connection Management**:
   - Connection to SurrealDB instances (local, remote, cloud)
   - Authentication with username/password
   - Namespace and database selection
   - Connection closure in finally block

2. **Basic Operations**:
   - Query: Execute raw SurrealQL queries
   - Create: Create records in a table
   - Update: Update records in a table
   - Select: Retrieve records from a table
   - Delete: Delete records from a table

3. **Credential Management**:
   - Support for connection string or individual parameters
   - Secure storage of credentials
   - Credential testing functionality

### What Needs Improvement

1. **Resource Organization**:
   - Operations are not organized by resources (Record, Table, Query, System)
   - UI doesn't reflect the resource-based structure

2. **Operation Implementation**:
   - Some operations are missing (Get Record, Merge, Upsert, etc.)
   - Existing operations don't fully align with PRD specifications

3. **Input Validation**:
   - Limited validation for input fields
   - Inconsistent error messages

4. **Output Transformation**:
   - Inconsistent output formatting across operations
   - Array results handling could be improved

5. **Error Handling**:
   - Error messages could be more descriptive
   - Some edge cases may not be handled properly

### What's Left to Build

1. **Record Resource Operations**:
   - Get: Retrieve a specific record by ID
   - Merge: Merge data into a specific record
   - Upsert: Create or update a record

2. **Table Resource Operations**:
   - Get All Records: Retrieve all records with pagination
   - Create Many: Create multiple records in a single operation
   - Get Many: Retrieve multiple specific records by their IDs

3. **Query Resource Enhancements**:
   - Add pagination support
   - Improve parameter handling

4. **System Resource Operations**:
   - Health Check: Check if the database instance is responsive
   - Version: Get the version of the SurrealDB instance

5. **UI Improvements**:
   - Reorganize properties to match the resource-based structure
   - Update display options for better UX
   - Add more descriptive field labels and placeholders

## Evolution of Project Decisions

### Initial Implementation

The initial implementation focused on basic connectivity and core operations:

1. **Connection Management**: Implemented connection to SurrealDB with authentication and namespace/database selection.
2. **Basic Operations**: Implemented query, create, update, select, and delete operations.
3. **Credential Management**: Added support for connection string or individual parameters.

### Current Refactoring Plan

Based on the PRD requirements, a comprehensive refactoring plan has been developed:

1. **Phase 1: Preparation and Infrastructure**
   - Create utility functions for RecordId handling, input validation, and output transformation

2. **Phase 2: Resource-Based Restructuring**
   - Implement Record, Table, Query, and System resource operations

3. **Phase 3: UI and UX Improvements**
   - Update node properties and enhance error handling

4. **Phase 4: Final Testing and Documentation**
   - Comprehensive testing and documentation updates

This plan provides a structured approach to updating the node while minimizing the risk of breaking existing functionality.

## Known Issues

1. **RecordId Handling**: The current implementation doesn't use the RecordId class from the SurrealDB SDK, which may cause issues with some operations.

2. **Cloud vs. Self-hosted**: There may be differences in how cloud and self-hosted instances of SurrealDB handle connections and authentication.

3. **Error Handling**: Some error scenarios may not be handled properly, leading to unclear error messages.

4. **Output Formatting**: Output formatting is inconsistent across operations, which may cause confusion for users.

5. **Input Validation**: Limited validation for input fields may allow invalid inputs, leading to runtime errors.

## Next Milestone

Phase 2 of the refactoring plan has been completed:

1. **Implement Record Resource Operations (Completed)**
   - Added Create Record operation (refactored existing create)
   - Added Get Record operation to retrieve a specific record by ID
   - Added Update Record operation (refactored existing update)
   - Added Merge Record operation to merge data into a specific record
   - Added Delete Record operation (refactored existing delete)
   - Added Upsert Record operation to create or update a record
   - All operations implemented with proper validation and error handling

2. **Implement Table Resource Operations (Completed)**
   - Added Get All Records operation (refactored existing select) with pagination
   - Added Create Many operation to create multiple records in a single operation
   - Added Get Many operation to retrieve multiple specific records by their IDs
   - All operations implemented with proper validation and error handling

3. **Implement Query Resource Operations (Completed)**
   - Refactored existing query operation
   - Added pagination support with LIMIT and START parameters
   - Improved array result handling to properly return multiple items
   - Enhanced parameter handling with validation

4. **Implement System Resource Operations (Completed)**
   - Added Health Check operation using n8n's httpRequest helper
   - Added Version operation with fallback mechanism:
     - First tries using `db.query('INFO FOR SERVER')`
     - Falls back to the /version endpoint if needed
   - Both operations implemented with proper error handling
   - System operations do not throw errors on failure, but return a status indicating success or failure

The next milestone is to begin Phase 3 of the refactoring plan: UI and UX Improvements. This will involve:

1. **Update Node Properties (Completed)**
   - Refined existing properties in `SurrealDbProperties.ts`
   - Fixed related bugs in Table operations (`getAllRecords`, `createMany`, `getMany`)
   - Enhanced field descriptions and placeholders
   - Improved display options for better UX
   - Tested all UI combinations

2. **Add Optional Namespace/Database Overrides (Completed)**
   - Added optional fields ("Namespace", "Database") to the node UI
   - Allow users to specify a Namespace and Database for an operation, overriding the credential settings
   - Updated `SurrealDbProperties.ts`, `SurrealDb.node.ts`, and `GenericFunctions.ts`
   - Moved the "Advanced Options" block to the end of the properties list

3. **Cleanup Credentials UI (In Progress)**
   This task has been broken down into the following subtasks:

   **Subtask 3.1: Update Credential Definition**
   - Remove WebSocket (ws/wss) protocol options from the protocol dropdown in `SurrealDbApi.credentials.ts`
   - Set default protocol to HTTPS instead of ws
   - Update descriptions to reflect HTTP/HTTPS only support
   - Add a `test` property to enable standard n8n credential testing

   **Subtask 3.2: Update Type Definitions**
   - Update `surrealDb.types.ts` to remove WebSocket-related types or properties
   - Ensure type definitions align with the new credential structure
   - Update interfaces to reflect HTTP/HTTPS only connections

   **Subtask 3.3: Update Connection Functions**
   - Modify `buildParameterizedConnString` in `GenericFunctions.ts` to ensure it only builds HTTP/HTTPS URLs
   - Update `connectSurrealClient` to handle only HTTP/HTTPS connections
   - Add proper error handling for connection failures
   - Ensure cloud vs. self-hosted instance detection still works correctly

   **Subtask 3.4: Implement Standard Credential Test**
   - Update the credential test method in `SurrealDb.node.ts` to use n8n's standard credential testing approach
   - Ensure it properly handles HTTP/HTTPS connections
   - Provide clear error messages for connection failures
   - Test the credential test functionality with both valid and invalid credentials

   **Subtask 3.5: Testing and Validation**
   - Test all operations with the updated credential structure
   - Verify that connections work correctly with both HTTP and HTTPS
   - Ensure backward compatibility where possible
   - Document any breaking changes

4. **Enhance Error Handling**
   - Review error handling across all operations
   - Add more descriptive error messages
   - Ensure consistent error handling patterns
   - Test error scenarios
