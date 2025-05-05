# SurrealDB Node Resource/Operator Development Rules

This document provides guidelines, principles, and templates for creating and maintaining resources and operators in the SurrealDB n8n node.

## 1. Architecture Overview

The SurrealDB node follows a modular architecture organized around resources and operations:

- **Resources**: High-level entities like `record`, `table`, `field`, `index`, `query`, and `system`
- **Operations**: Specific actions that can be performed on resources (e.g., `createRecord`, `getAllRecords`)

### Key Architecture Principles

1. **Modularity**: Each resource is a self-contained module with its own operations
2. **Separation of Concerns**: UI definition, operation logic, and resource handling are separated
3. **Standardized Interfaces**: All operations implement the same interface
4. **Consistent Error Handling**: Errors are handled consistently across all operations

## 2. Resource Structure

Each resource should follow this directory structure:

```
resources/
└── resourceName/
    ├── operations/
    │   ├── operation1.operation.ts
    │   ├── operation2.operation.ts
    │   └── ...
    ├── resourceName.properties.ts
    └── resourceName.handler.ts
```

### 2.1 Resource Handler (`resourceName.handler.ts`)

The resource handler routes operations to their specific handlers:

```typescript
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { operation1Operation } from './operations/operation1.operation';
import { operation2Operation } from './operations/operation2.operation';
import { createErrorResult } from '../../utilities';

/**
 * Handle all operations for the ResourceName resource
 */
export async function handleResourceNameOperations(
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
        case 'operation1':
          returnData = [...returnData, ...(await operation1Operation.execute(client, items, executeFunctions, i))];
          break;
        case 'operation2':
          returnData = [...returnData, ...(await operation2Operation.execute(client, items, executeFunctions, i))];
          break;
        default:
          throw new Error(`The operation "${operation}" is not supported for the ResourceName resource!`);
      }
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        returnData.push(createErrorResult(error as Error, i));
        continue;
      }
      throw error;
    }
  }
  
  return returnData;
}
```

### 2.2 Resource Properties (`resourceName.properties.ts`)

The properties file defines the UI for the resource and its operations:

```typescript
import type { INodeProperties } from 'n8n-workflow';

/**
 * Operations available for the ResourceName resource
 */
export const resourceNameOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: [
          'resourceName',
        ],
      },
    },
    options: [
      {
        name: 'Operation 1 Display Name',
        value: 'operation1',
        description: 'Description of operation 1',
        action: 'Action description for operation 1',
      },
      {
        name: 'Operation 2 Display Name',
        value: 'operation2',
        description: 'Description of operation 2',
        action: 'Action description for operation 2',
      },
    ],
    default: 'operation1',
  },
];

/**
 * Fields available for the ResourceName resource
 */
export const resourceNameFields: INodeProperties[] = [
  // Common fields for all operations
  {
    displayName: 'Common Field',
    name: 'commonField',
    type: 'string',
    required: true,
    default: '',
    description: 'Description of the common field',
    displayOptions: {
      show: {
        resource: [
          'resourceName',
        ],
        operation: [
          'operation1',
          'operation2',
        ],
      },
    },
  },
  
  // Operation-specific fields
  {
    displayName: 'Operation 1 Field',
    name: 'operation1Field',
    type: 'string',
    required: true,
    default: '',
    description: 'Description of operation 1 field',
    displayOptions: {
      show: {
        resource: [
          'resourceName',
        ],
        operation: [
          'operation1',
        ],
      },
    },
  },
  
  // Options collection (common pattern for additional options)
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    description: 'Additional options for the resource operations',
    displayOptions: {
      show: {
        resource: [
          'resourceName',
        ],
      },
    },
    options: [
      {
        displayName: 'Namespace',
        name: 'namespace',
        type: 'string',
        default: '',
        placeholder: 'e.g., my_namespace',
        description: 'Optional namespace to use for this operation, overriding the credential setting',
      },
      {
        displayName: 'Database',
        name: 'database',
        type: 'string',
        default: '',
        placeholder: 'e.g., my_database',
        description: 'Optional database to use for this operation, overriding the credential setting',
      },
    ],
  },
];
```

## 3. Operation Structure

Each operation should be implemented in its own file following the `IOperationHandler` interface:

### 3.1 Operation Implementation (`operation1.operation.ts`)

```typescript
import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatSingleResult, debugLog, createErrorResult } from '../../../utilities';
import { validateRequiredField, prepareSurrealQuery, buildCredentialsObject } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Operation 1 handler for ResourceName resource
 */
export const operation1Operation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    try {
      if (DEBUG) debugLog('operation1', 'Starting operation', itemIndex);
      
      // Get credentials
      const credentials = await executeFunctions.getCredentials('surrealDbApi');
      
      // Get parameters for the specific item
      const param1 = executeFunctions.getNodeParameter('param1', itemIndex) as string;
      validateRequiredField(executeFunctions, param1, 'Parameter 1', itemIndex);
      
      // Get options
      const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
      
      // Build credentials object with potential overrides
      const resolvedCredentials = buildCredentialsObject(credentials, options);
      
      // Perform the operation
      // ...
      
      // Format and return the result
      return [formatSingleResult(result, {}, itemIndex)];
    } catch (error) {
      // Let the resource handler handle the error
      throw error;
    }
  }
};
```

## 4. Registering Resources and Operations

### 4.1 Register in SurrealDbProperties.ts

```typescript
import type { INodeProperties } from 'n8n-workflow';

// Import resource-specific properties from modular files
import { resourceNameOperations, resourceNameFields } from './resources/resourceName';
// ... other imports

export const nodeProperties: INodeProperties[] = [
  {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    options: [
      // ... existing resources
      {
        name: 'Resource Name',
        value: 'resourceName',
        description: 'Description of the resource',
      },
    ],
    default: 'record',
  },
  
  // Include operations for each resource
  ...resourceNameOperations,
  // ... other resource operations
  
  // Include fields for each resource
  ...resourceNameFields,
  // ... other resource fields
];
```

### 4.2 Register in SurrealDb.node.ts

```typescript
// Import the new resource handler
import { handleResourceNameOperations } from './resources/resourceName';

// In the execute method:
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  // ... existing code
  
  try {
    // ... existing resources
    else if (resource === 'resourceName') {
      returnData = await handleResourceNameOperations(operation, client, items, this);
    }
    // ... other resources
  } catch (error) {
    // ... error handling
  }
  
  // ... return data
}
```

## 5. Error Handling

Follow these principles for error handling:

1. **Operation Level**: Operations should throw errors rather than handling them internally
2. **Resource Handler Level**: Resource handlers should catch errors and:
   - If `continueOnFail()` is true, add an error result and continue
   - Otherwise, rethrow the error
3. **Validation**: Use utility functions like `validateRequiredField()` for input validation
4. **Standardized Error Results**: Use `createErrorResult()` to create standardized error objects

## 6. Result Formatting

Use the utility functions for consistent result formatting:

1. **Single Results**: Use `formatSingleResult()` for operations that return a single item
2. **Array Results**: Use `formatArrayResult()` for operations that return multiple items
3. **Error Results**: Use `createErrorResult()` for error responses
4. **Success Results**: Use `addSuccessResult()` for simple success messages

## 7. Naming Conventions

Follow these naming conventions:

1. **Resource Names**: Use camelCase for resource values (e.g., `resourceName`)
2. **Operation Names**: Use camelCase for operation values (e.g., `operationName`)
3. **File Names**:
   - Resource handler: `resourceName.handler.ts`
   - Resource properties: `resourceName.properties.ts`
   - Operation implementation: `operationName.operation.ts`
4. **Function Names**:
   - Resource handler: `handleResourceNameOperations`
   - Operation implementation: `operationNameOperation`

## 8. Debug Logging

Include debug logging in all operations:

```typescript
// Set to true to enable debug logging, false to disable
const DEBUG = false;

// In operation code
if (DEBUG) debugLog('operationName', 'Message', itemIndex);
```

## 9. Best Practices

1. **Modular Design**: Keep resources and operations modular and self-contained
2. **Consistent Interfaces**: Follow the established interfaces and patterns
3. **Validation**: Always validate required inputs
4. **Error Handling**: Handle errors at the resource handler level
5. **Documentation**: Include JSDoc comments for all functions and interfaces
6. **Type Safety**: Use TypeScript types for all parameters and return values
7. **Credential Handling**: Use the standard credential handling patterns
8. **Query Building**: Use utility functions for building queries
9. **Result Formatting**: Use the standard result formatting functions
10. **Debug Logging**: Include debug logging in all operations

## 10. Templates

### 10.1 New Resource Template

To create a new resource:

1. Create the directory structure:
   ```
   resources/
   └── newResource/
       ├── operations/
       ├── newResource.properties.ts
       └── newResource.handler.ts
   ```

2. Implement the resource handler and properties files
3. Register the resource in `SurrealDbProperties.ts`
4. Register the resource handler in `SurrealDb.node.ts`

### 10.2 New Operation Template

To add a new operation to an existing resource:

1. Create the operation file:
   ```
   resources/
   └── existingResource/
       ├── operations/
       │   └── newOperation.operation.ts
       └── ...
   ```

2. Implement the operation following the `IOperationHandler` interface
3. Add the operation to the resource's operations array in the properties file
4. Add the operation case to the resource handler's switch statement

## 11. Testing

When implementing new resources or operations:

1. **Build Check**: Run `npm run build` to check for TypeScript errors
2. **Manual Testing**: Test the operation in the n8n UI
3. **Error Handling**: Test error cases and validation
4. **Edge Cases**: Test with empty inputs, large datasets, etc.

## 12. Conclusion

Following these guidelines will ensure that new resources and operations are consistent with the existing codebase and maintain the modular architecture of the SurrealDB node.
