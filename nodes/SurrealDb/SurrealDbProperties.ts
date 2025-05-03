import type { INodeProperties } from 'n8n-workflow';

// Import resource-specific properties from modular files
import { systemOperations, systemFields } from './resources/system';
import { queryOperations, queryFields } from './resources/query';
import { recordOperations, recordFields } from './resources/record';
import { tableOperations, tableFields } from './resources/table/table.properties';

/**
 * Node properties array for SurrealDB node
 * 
 * Following a modular architecture:
 * 1. Resource selector comes first
 * 2. Each resource module contributes its operations
 * 3. Each resource module contributes its fields
 */
export const nodeProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Record',
				value: 'record',
				description: 'Operations on individual records',
			},
			{
				name: 'Table',
				value: 'table',
				description: 'Operations on entire tables',
			},
			{
				name: 'Query',
				value: 'query',
				description: 'Execute arbitrary SurrealQL queries',
			},
			{
				name: 'System',
				value: 'system',
				description: 'Database system-level checks',
			},
		],
		default: 'record',
	},
	// Include record operations from modular file
	...recordOperations,
	// Include table operations from modular file
	...tableOperations,
	// Include query operations from modular file
	...queryOperations,
	// Include system operations from modular file
	...systemOperations,

	// Include record fields from modular file
	...recordFields,
	
	// Include table fields from modular file
	...tableFields,
	
	// Include query fields from modular file
	...queryFields,

	// Include system fields from modular file
	...systemFields,
];
