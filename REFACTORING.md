# SurrealDB Node Refactoring Strategy

This document outlines a detailed approach for refactoring the SurrealDB node to improve maintainability and prepare for future feature additions.

## Problem Statement

The current SurrealDB node implementation has several challenges:

1. The main implementation file (`SurrealDb.node.ts`) is very long (1,370+ lines).
2. All operation logic is in a single file with deeply nested conditional blocks.
3. Adding new resources and operations (schema management and relations) would further complicate the codebase.
4. Testing individual operations is difficult due to lack of modularity.

## Proposed Architecture

### 1. Resource-Based Module Structure

Create a directory structure organized by resources:

```
/nodes/SurrealDb/
├── GenericFunctions.ts (shared utilities)
├── SurrealDb.node.ts (main entry point, much shorter)
├── SurrealDbProperties.ts (properties definition)
├── resources/
│   ├── record/
│   │   ├── operations/
│   │   │   ├── create.operation.ts
│   │   │   ├── get.operation.ts
│   │   │   ├── update.operation.ts
│   │   │   ├── merge.operation.ts
│   │   │   ├── delete.operation.ts
│   │   │   └── upsert.operation.ts
│   │   ├── record.properties.ts (record-specific properties)
│   │   └── record.handler.ts (executes record operations)
│   ├── table/
│   │   ├── operations/
│   │   │   ├── getAllRecords.operation.ts
│   │   │   ├── createMany.operation.ts
│   │   │   └── ...
│   │   ├── table.properties.ts
│   │   └── table.handler.ts
│   ├── query/
│   │   ├── operations/
│   │   │   └── executeQuery.operation.ts
│   │   ├── query.properties.ts
│   │   └── query.handler.ts
│   ├── system/
│   │   ├── operations/
│   │   │   ├── healthCheck.operation.ts
│   │   │   └── version.operation.ts
│   │   ├── system.properties.ts
│   │   └── system.handler.ts
│   ├── schema/ (for future schema operations)
│   │   └── ...
│   └── relations/ (for future relation operations)
│       └── ...
├── types/
│   ├── surrealDb.types.ts
│   └── operation.types.ts (new interface definitions)
└── utilities.ts
```

### 2. Operation Handler Interface

Create a common interface for all operation handlers:

```typescript
// types/operation.types.ts
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Surreal } from 'surrealdb';

export interface IOperationHandler {
  execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number
  ): Promise<INodeExecutionData[]>;
}
```

### 3. Resource Handler Implementation

Each resource handler would implement operations for that resource:

```typescript
// resources/record/record.handler.ts
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Surreal } from 'surrealdb';
import { createRecordOperation } from './operations/create.operation';
import { getRecordOperation } from './operations/get.operation';
// ...other imports

export async function handleRecordOperations(
  operation: string,
  client: Surreal,
  items: INodeExecutionData[],
  executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  let returnData: INodeExecutionData[] = [];
  const itemsLength = items.length;

  for (let i = 0; i < itemsLength; i++) {
    try {
      switch (operation) {
        case 'createRecord':
          returnData = [...returnData, ...(await createRecordOperation.execute(client, items, executeFunctions, i))];
          break;
        case 'getRecord':
          returnData = [...returnData, ...(await getRecordOperation.execute(client, items, executeFunctions, i))];
          break;
        // ...other operations
      }
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        returnData.push({
          json: { error: (error as Error).message },
          pairedItem: { item: i },
        });
        continue;
      }
      throw error;
    }
  }
  
  return returnData;
}
```

### 4. Individual Operation Implementation

Each operation would be in its own file:

```typescript
// resources/record/operations/create.operation.ts
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Surreal } from 'surrealdb';
import { validateRequiredField, validateJSON } from '../../../GenericFunctions';
import { formatSingleResult } from '../../../utilities';
import type { IOperationHandler } from '../../../types/operation.types';

export const createRecordOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    // Get parameters
    let table = executeFunctions.getNodeParameter('table', itemIndex) as string;
    validateRequiredField(executeFunctions, table, 'Table', itemIndex);
    
    // Implementation of create record operation
    // ... (existing code from SurrealDb.node.ts)
    
    // Return the formatted result
    return [{
      ...formattedResult,
      pairedItem: { item: itemIndex },
    }];
  }
};
```

### 5. Simplified Main Class

The main SurrealDb.node.ts file becomes much simpler:

```typescript
// SurrealDb.node.ts
import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

import { connectSurrealClient, validateAndResolveSurrealCredentials } from './GenericFunctions';
import { nodeProperties } from './SurrealDbProperties';
import { handleRecordOperations } from './resources/record/record.handler';
import { handleTableOperations } from './resources/table/table.handler';
import { handleQueryOperations } from './resources/query/query.handler';
import { handleSystemOperations } from './resources/system/system.handler';

export class SurrealDb implements INodeType {
  description: INodeTypeDescription = {
    // ...existing description
    properties: nodeProperties,
  };

  methods = {};

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('surrealDbApi');
    const options = this.getNodeParameter('options', 0, {}) as IDataObject;
    const nodeNamespace = (options.namespace as string)?.trim() || '';
    const nodeDatabase = (options.database as string)?.trim() || '';
    
    // Resolve credentials and connect
    const resolvedCredentials = validateAndResolveSurrealCredentials(
      this,
      credentials,
      nodeNamespace,
      nodeDatabase,
    );
    
    const client = await connectSurrealClient(resolvedCredentials);
    
    try {
      const items = this.getInputData();
      const resource = this.getNodeParameter('resource', 0) as string;
      const operation = this.getNodeParameter('operation', 0) as string;
      
      let returnData: INodeExecutionData[] = [];
      
      // Route to appropriate resource handler
      switch (resource) {
        case 'record':
          returnData = await handleRecordOperations(operation, client, items, this);
          break;
        case 'table':
          returnData = await handleTableOperations(operation, client, items, this);
          break;
        case 'query':
          returnData = await handleQueryOperations(operation, client, items, this);
          break;
        case 'system':
          returnData = await handleSystemOperations(operation, client, items, this);
          break;
      }
      
      return [returnData];
    } finally {
      // Always close the connection
      await client.close();
    }
  }
}
```

### 6. Refactored Properties Definition

Split properties by resource:

```typescript
// resources/record/record.properties.ts
import type { INodeProperties } from 'n8n-workflow';

export const recordOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['record'],
      },
    },
    options: [
      // ...record operation options
    ],
    default: 'createRecord',
  },
];

export const recordFields: INodeProperties[] = [
  // ...record specific fields
];
```

```typescript
// SurrealDbProperties.ts
import type { INodeProperties } from 'n8n-workflow';
import { recordOperations, recordFields } from './resources/record/record.properties';
import { tableOperations, tableFields } from './resources/table/table.properties';
import { queryOperations, queryFields } from './resources/query/query.properties';
import { systemOperations, systemFields } from './resources/system/system.properties';

export const nodeProperties: INodeProperties[] = [
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    options: [
      // ...resource options
    ],
    default: 'record',
  },
  ...recordOperations,
  ...recordFields,
  ...tableOperations,
  ...tableFields,
  ...queryOperations,
  ...queryFields,
  ...systemOperations,
  ...systemFields,
];
```

## Implementation Strategy

The refactoring will be done in incremental steps to ensure functionality is preserved:

### Phase 1: Preparation

1. Create the new directory structure
2. Create the operation handler interface
3. Move common types to the types directory
4. Test to ensure the current code still works before making changes

### Phase 2: System Resource (Simplest)

1. Create `resources/system/system.properties.ts`
2. Move operation-specific properties
3. Create operation files (`resources/system/operations/`)
4. Implement the system resource handler
5. Test to ensure system operations work as expected

### Phase 3: Query Resource

1. Create `resources/query/query.properties.ts`
2. Move query operation properties
3. Create operation files (`resources/query/operations/`)
4. Implement the query resource handler
5. Test query operations

### Phase 4: Record Resource

1. Create `resources/record/record.properties.ts`
2. Move record operation properties
3. Create operation files for each record operation
4. Implement the record resource handler
5. Test all record operations

### Phase 5: Table Resource

1. Create `resources/table/table.properties.ts`
2. Move table operation properties
3. Create operation files for each table operation
4. Implement the table resource handler
5. Test all table operations

### Phase 6: Main Node Class Refactoring

1. Update the main SurrealDb.node.ts file to use the new handlers
2. Update SurrealDbProperties.ts to use the resource-specific properties
3. Comprehensive testing to ensure all operations work as expected

### Phase 7: Cleanup and Documentation

1. Remove any redundant code
2. Update documentation
3. Add code comments for clarity
4. Final round of testing

## Benefits of This Approach

1. **Maintainability**: Each operation is in its own file, making it easier to understand and maintain.
2. **Extensibility**: Adding new resources or operations becomes straightforward.
3. **Testing**: Individual operations can be tested in isolation.
4. **Organization**: Clear separation of concerns between resources.
5. **Readability**: Main file is focused on high-level flow, not implementation details.
6. **Future-proof**: Easy to add the planned schema and relations resources.

## Risks and Mitigations

1. **Risk**: Breaking existing functionality
   **Mitigation**: Incremental approach with testing after each step

2. **Risk**: Increased complexity in file structure
   **Mitigation**: Clear documentation and consistent naming conventions

3. **Risk**: Overhead in maintaining more files
   **Mitigation**: Improved organization will offset this cost in the long term

## Conclusion

This refactoring approach will significantly improve the maintainability of the SurrealDB node while preparing it for upcoming features. By breaking the monolithic implementation into resource-based modules, we'll make the codebase more manageable, testable, and extensible.