# Technical Context: n8n-nodes-surrealdb

## Technologies Used

### Core Technologies

1. **TypeScript**
   - Primary programming language for the node implementation
   - Provides type safety and modern JavaScript features
   - Version: ~4.9.5 (as specified in package.json)

2. **n8n Workflow & Core Libraries**
   - Provides the framework for node development
   - Includes interfaces and utilities for node implementation
   - Version: ^1.0.0 (as specified in package.json)

3. **SurrealDB JavaScript SDK**
   - Official SDK for interacting with SurrealDB
   - Handles connection, authentication, and database operations
   - Version: ^1.0.0 (as specified in package.json)

### Supporting Technologies

1. **Lodash**
   - Utility library for common JavaScript operations
   - Used for data manipulation (get, set)
   - Version: ^4.17.16 (as specified in package.json)

2. **Gulp**
   - Build tool for processing assets
   - Used for building icons
   - Version: ^4.0.2 (as specified in package.json)

3. **ESLint & Prettier**
   - Code quality and formatting tools
   - Ensures consistent code style
   - Versions: ESLint plugins as specified in package.json, Prettier ^2.8.8

## Development Setup

### Project Structure

The project follows the standard n8n community node structure:

```
n8n-nodes-surrealdb/
├── credentials/           # Credential definitions
├── nodes/                 # Node implementations
├── src/                   # Source code entry point
├── dist/                  # Compiled output (generated)
├── package.json           # Project configuration
└── tsconfig.json          # TypeScript configuration
```

### Build Process

The build process is defined in package.json:

1. **Development**: `npm run dev` - Runs TypeScript in watch mode for live reloading
2. **Build**: `npm run build` - Compiles TypeScript and builds icons
3. **Formatting**: `npm run format` - Formats code using Prettier
4. **Linting**: `npm run lint` - Checks code quality using ESLint
5. **Linting with fixes**: `npm run lintfix` - Fixes linting issues automatically
6. **Prepublish**: `npm run prepublishOnly` - Builds and lints code before publishing

### n8n Integration

The node is integrated with n8n through the configuration in package.json:

```json
"n8n": {
  "n8nNodesApiVersion": 1,
  "credentials": [
    "dist/credentials/SurrealDbApi.credentials.js"
  ],
  "nodes": [
    "dist/nodes/SurrealDb/SurrealDb.node.js"
  ]
}
```

This configuration tells n8n where to find the node and credential definitions.

## Technical Constraints

### SurrealDB SDK Limitations

1. **RecordId Handling**: The SurrealDB SDK requires proper handling of record IDs using the RecordId class.
2. **Connection Management**: Connections must be properly established and closed to prevent resource leaks.
3. **Authentication**: Different authentication methods (root, namespace, database) require different approaches.
4. **Cloud vs. Self-hosted**: Cloud instances of SurrealDB may require different connection handling.

### n8n Framework Constraints

1. **Node API Version**: The node uses n8n Nodes API Version 1, which defines the available interfaces and functionality.
2. **Execution Model**: n8n's execution model requires proper handling of input items and output formatting.
3. **Credential Security**: Credentials must be handled securely according to n8n's credential system.
4. **Error Handling**: Errors must be properly caught and formatted using NodeOperationError.

### JavaScript/TypeScript Constraints

1. **Async Operations**: All database operations are asynchronous and require proper async/await handling.
2. **Type Safety**: TypeScript interfaces must be defined for all data structures to ensure type safety.
3. **JSON Handling**: JSON input/output requires proper parsing and stringification.

## Dependencies

### Direct Dependencies

- **surrealdb**: ^1.0.0 - Official SurrealDB JavaScript SDK

### Development Dependencies

- **@types/express**: ^4.17.17 - TypeScript definitions for Express
- **@types/lodash**: ^4.17.16 - TypeScript definitions for Lodash
- **@types/request-promise-native**: ^1.0.18 - TypeScript definitions for request-promise-native
- **@typescript-eslint/parser**: ^5.59.2 - TypeScript parser for ESLint
- **eslint-plugin-n8n-nodes-base**: ^1.13.1 - ESLint plugin for n8n nodes
- **gulp**: ^4.0.2 - Build tool for assets
- **n8n-core**: ^1.0.0 - n8n core library
- **n8n-workflow**: ^1.0.0 - n8n workflow library
- **prettier**: ^2.8.8 - Code formatter
- **typescript**: ~4.9.5 - TypeScript compiler

## Tool Usage Patterns

### SurrealDB SDK Usage

```typescript
// Connection establishment
const db = new Surreal();
await db.connect(connectionString);
await db.signin({ username, password });
await db.use({ ns: namespace, db: database });

// Database operations
const result = await db.query(query, params);
const record = await db.select(table);
const created = await db.create(table, data);
const updated = await db.update(recordId, data);
const merged = await db.merge(recordId, data);
const deleted = await db.delete(recordId);

// Connection closure
await db.close();
```

### n8n Node Development Patterns

```typescript
// Node implementation
export class SurrealDb implements INodeType {
  description: INodeTypeDescription = {
    // Node description
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Get credentials
    const credentials = await this.getCredentials('surrealDbApi');
    
    // Get operation
    const operation = this.getNodeParameter('operation', 0);
    
    // Execute operation
    // ...
    
    // Return data
    return [returnData];
  }
}

// Error handling
try {
  // Operation code
} catch (error) {
  throw new NodeOperationError(this.getNode(), error, { itemIndex });
}

// Parameter retrieval
const param = this.getNodeParameter('paramName', itemIndex) as string;
```

These patterns form the foundation of the node's implementation and guide the development process.
