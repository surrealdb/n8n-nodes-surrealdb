# System Patterns: n8n-nodes-surrealdb

## System Architecture

The n8n-nodes-surrealdb node follows a modular architecture that aligns with n8n's node development patterns:

```
n8n-nodes-surrealdb/
├── credentials/
│   └── SurrealDbApi.credentials.ts    # Credential definition for SurrealDB connections
├── nodes/
│   └── SurrealDb/
│       ├── GenericFunctions.ts        # Shared utility functions
│       ├── SurrealDb.node.ts          # Main node implementation
│       ├── SurrealDbProperties.ts     # Node UI properties definition
│       ├── surrealDb.types.ts         # TypeScript type definitions
│       ├── utilities.ts               # Additional utility functions
│       └── surrealdb.svg              # Node icon
└── src/
    └── index.ts                       # Entry point for node registration
```

## Key Technical Decisions

### 1. Resource-Based Organization

The node functionality is organized by resources (Record, Table, Query, System) to provide a clear, intuitive structure for users. This approach:

- Makes it easier for users to find the operations they need
- Provides a logical grouping of related operations
- Aligns with SurrealDB's conceptual model
- Follows best practices for database operation organization

### 2. SurrealDB SDK Integration

The node uses the official SurrealDB JavaScript SDK (`surrealdb.js`) for all database operations. This ensures:

- Compatibility with SurrealDB's API
- Proper handling of authentication and connection management
- Access to all SurrealDB features
- Easier maintenance as the SDK evolves

### 3. Connection Management

Connections to SurrealDB are established at the beginning of node execution and closed at the end, following n8n best practices:

- Connection is established in the `execute` method
- Authentication is handled securely
- Namespace and database context are set appropriately
- Connection is closed in a `finally` block to ensure cleanup

### 4. Input Validation

Comprehensive input validation is implemented to prevent errors and provide helpful feedback to users:

- JSON validation for fields accepting JSON input
- Required field validation
- Type validation for numeric fields
- Array validation where appropriate

### 5. Output Transformation

Consistent output formatting is applied across all operations:

- Single results: `{ json: { result: <response_data> } }`
- Array results: Each item as a separate n8n item: `[{ json: item1 }, { json: item2 }, ...]`
- Error responses: Descriptive error messages using `NodeOperationError`

### 6. Error Handling

Robust error handling is implemented throughout the node:

- Specific error messages for different types of errors
- Proper use of `NodeOperationError` with item index
- Option to continue on failure for batch operations

## Component Relationships

1. **Node Entry Point (`SurrealDb.node.ts`)**
   - Implements the `INodeType` interface
   - Defines the node description
   - Contains the `execute` method that handles all operations
   - Uses components from other files

2. **Node Properties (`SurrealDbProperties.ts`)**
   - Defines the UI properties for the node
   - Specifies operation options and their display conditions
   - Configures field validation and display options

3. **Credentials (`SurrealDbApi.credentials.ts`)**
   - Defines the credential fields for SurrealDB connections
   - Handles different connection types (connection string vs. individual parameters)

4. **Generic Functions (`GenericFunctions.ts`)**
   - Provides utility functions for connection management
   - Contains helper functions for data preparation
   - Implements validation and error handling

5. **Types (`surrealDb.types.ts`)**
   - Defines TypeScript interfaces for credentials and other data structures
   - Ensures type safety throughout the codebase

6. **Utilities (`utilities.ts`)**
   - Contains additional helper functions
   - Implements specialized functionality like RecordId handling

## Critical Implementation Paths

1. **Connection Establishment**
   ```
   execute() -> getCredentials() -> validateAndResolveSurrealCredentials() -> connectSurrealClient()
   ```

2. **Operation Execution**
   ```
   execute() -> getNodeParameter('operation') -> [operation-specific code] -> format results
   ```

3. **Error Handling**
   ```
   try { ... } catch (error) { throw new NodeOperationError() } finally { client.close() }
   ```

4. **Data Transformation**
   ```
   Input data -> validation -> SurrealDB operation -> result formatting -> n8n output
   ```

These patterns form the foundation of the node's architecture and guide the implementation of all features.
