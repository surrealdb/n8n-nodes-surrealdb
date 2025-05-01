# SurrealDB Node Refactoring Plan

This document outlines a step-by-step plan for refactoring the SurrealDB node to align with the requirements specified in the PRD. The plan is designed to minimize the risk of breaking existing functionality while making incremental changes toward the end goal.

## Current State Analysis

The current implementation has several limitations compared to the PRD requirements:

1. **Resource Organization**: The node is not organized by resources (Record, Table, Query, System) as specified in the PRD.
2. **Operations**: The current operations (create, delete, query, select, update) don't fully align with the PRD's operation structure.
3. **Record ID Handling**: The current implementation doesn't use the `RecordId` class from the SurrealDB SDK.
4. **Input Validation**: Limited validation for input fields.
5. **Output Transformation**: Inconsistent output formatting.

## Refactoring Strategy

The refactoring will be done in small, incremental steps, with testing after each step to ensure functionality is preserved.

### Phase 1: Preparation and Infrastructure

1. **Create RecordId Utility Function**
   - Add a utility function to handle the creation of RecordId objects
   - Test with existing operations to ensure compatibility

2. **Enhance Input Validation**
   - Add JSON validation functions
   - Add required field validation functions
   - Add type validation functions
   - Test with existing operations

3. **Standardize Output Transformation**
   - Create helper functions for consistent output formatting
   - Test with existing operations

### Phase 2: Resource-Based Restructuring

4. **Implement Record Resource Operations**
   - Add Create operation (refactor existing create)
   - Add Get operation
   - Add Update operation (refactor existing update)
   - Add Merge operation
   - Add Delete operation (refactor existing delete)
   - Add Upsert operation
   - Test each operation individually

5. **Implement Table Resource Operations**
   - Add Get All Records operation (refactor existing select)
   - Add Create Many operation
   - Add Get Many operation
   - Test each operation individually

6. **Implement Query Resource Operations**
   - Refactor existing query operation
   - Add pagination support
   - Test with various query types

7. **Implement System Resource Operations**
   - Add Health Check operation
   - Add Version operation
   - Test each operation

### Phase 3: UI and UX Improvements

8. **Update Node Properties**
   - Reorganize properties to match the resource-based structure
   - Update display options for better UX
   - Test all UI combinations

9. **Enhance Error Handling**
   - Implement consistent error handling across all operations
   - Add more descriptive error messages
   - Test error scenarios

### Phase 4: Final Testing and Documentation

10. **Comprehensive Testing**
    - Test all operations with various input combinations
    - Test edge cases and error scenarios
    - Verify output formatting

11. **Update Documentation**
    - Update inline code documentation
    - Update README.md with usage examples

## Detailed Implementation Plan

### Step 1: Create RecordId Utility Function

**File**: `nodes/SurrealDb/utilities.ts`

Add a function to create RecordId objects from table name and ID:

```typescript
import { Surreal } from 'surrealdb';

/**
 * Create a RecordId object from table name and ID
 */
export function createRecordId(table: string, id: string) {
  return new Surreal.RecordId(table, id);
}
```

**Testing**: Verify the function works correctly with the SurrealDB SDK.

### Step 2: Enhance Input Validation

**File**: `nodes/SurrealDb/GenericFunctions.ts`

Add validation functions:

```typescript
/**
 * Validate JSON input
 */
export function validateJSON(self: IExecuteFunctions, input: string, itemIndex: number): any {
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new NodeOperationError(self.getNode(), 'Invalid JSON provided', { itemIndex });
  }
}

/**
 * Validate required field
 */
export function validateRequiredField(self: IExecuteFunctions, field: any, fieldName: string, itemIndex: number): void {
  if (field === undefined || field === '') {
    throw new NodeOperationError(self.getNode(), `${fieldName} is required`, { itemIndex });
  }
}

/**
 * Validate numeric field
 */
export function validateNumericField(self: IExecuteFunctions, field: any, fieldName: string, itemIndex: number): number {
  const num = Number(field);
  if (isNaN(num) || num < 0) {
    throw new NodeOperationError(self.getNode(), `${fieldName} must be a positive number`, { itemIndex });
  }
  return num;
}
```

**Testing**: Use these functions with existing operations to ensure they work correctly.

### Step 3: Standardize Output Transformation

**File**: `nodes/SurrealDb/GenericFunctions.ts`

Add output transformation functions:

```typescript
/**
 * Format single result output
 */
export function formatSingleResult(result: any): INodeExecutionData {
  return { json: { result } };
}

/**
 * Format array result output
 */
export function formatArrayResult(results: any[]): INodeExecutionData[] {
  return results.map(item => ({ json: item }));
}
```

**Testing**: Use these functions with existing operations to ensure they work correctly.

### Step 4: Implement Record Resource Operations

**File**: `nodes/SurrealDb/SurrealDbProperties.ts`

Update the node properties to include the Record resource operations:

```typescript
// Add Record resource operations to the existing operations
{
  name: 'Create Record',
  value: 'createRecord',
  description: 'Create a new record',
  action: 'Create a record',
},
{
  name: 'Get Record',
  value: 'getRecord',
  description: 'Retrieve a specific record by ID',
  action: 'Get a record',
},
// ... other operations
```

**File**: `nodes/SurrealDb/SurrealDb.node.ts`

Implement the Record resource operations in the execute method:

```typescript
// Implement each operation in the execute method
if (operation === 'createRecord') {
  // Implementation for Create Record operation
}
if (operation === 'getRecord') {
  // Implementation for Get Record operation
}
// ... other operations
```

**Testing**: Test each operation individually to ensure it works correctly.

### Subsequent Steps

Continue implementing each step in the plan, testing after each change to ensure functionality is preserved.

## Testing Strategy

1. **Unit Testing**: Test each function and operation individually.
2. **Integration Testing**: Test the node with a real SurrealDB instance.
3. **Edge Case Testing**: Test with various input combinations, including invalid inputs.
4. **Regression Testing**: Ensure existing functionality continues to work.

## Conclusion

This refactoring plan provides a structured approach to updating the SurrealDB node to meet the requirements specified in the PRD. By breaking the work into small, incremental steps and testing after each change, we can minimize the risk of breaking existing functionality while making progress toward the end goal.
