import type { INodeProperties } from 'n8n-workflow';

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
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [
					'record',
				],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'createRecord',
				description: 'Create a new record',
				action: 'Create a record',
			},
			{
				name: 'Get',
				value: 'getRecord',
				description: 'Retrieve a specific record by ID',
				action: 'Get a record',
			},
			{
				name: 'Update',
				value: 'updateRecord',
				description: 'Replace the content of a specific record',
				action: 'Update a record',
			},
			{
				name: 'Merge',
				value: 'mergeRecord',
				description: 'Merge data into a specific record',
				action: 'Merge a record',
			},
			{
				name: 'Delete',
				value: 'deleteRecord',
				description: 'Delete a specific record by ID',
				action: 'Delete a record',
			},
			{
				name: 'Upsert',
				value: 'upsertRecord',
				description: 'Create a record if it doesn\'t exist, or update it if it does',
				action: 'Upsert a record',
			},
		],
		default: 'createRecord',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [
					'table',
				],
			},
		},
		options: [
			{
				name: 'Get All Records',
				value: 'getAllRecords',
				description: 'Retrieve all records from a table',
				action: 'Get all records from a table',
			},
			{
				name: 'Create Many',
				value: 'createMany',
				description: 'Create multiple records in a single operation',
				action: 'Create many records in a table',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve multiple specific records by their IDs',
				action: 'Get many records from a table',
			},
		],
		default: 'getAllRecords',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [
					'query',
				],
			},
		},
		options: [
			{
				name: 'Execute Query',
				value: 'executeQuery',
				description: 'Execute a raw SurrealQL query',
				action: 'Execute a SurrealQL query',
			},
		],
		default: 'executeQuery',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: [
					'system',
				],
			},
		},
		options: [
			{
				name: 'Health Check',
				value: 'healthCheck',
				description: 'Check if the database instance is responsive',
				action: 'Check database health',
			},
			{
				name: 'Version',
				value: 'version',
				description: 'Get the version of the SurrealDB instance',
				action: 'Get database version',
			},
		],
		default: 'healthCheck',
	},

	// Common fields for Record and Table resources
	{
		displayName: 'Table',
		name: 'table',
		type: 'string',
		required: true,
		default: '',
		description: 'SurrealDB table name',
		displayOptions: {
			show: {
				resource: [
					'record',
					'table',
				],
			},
			hide: {
				operation: [
					'getRecord',
					'updateRecord',
					'mergeRecord',
					'deleteRecord',
					'upsertRecord',
				],
			},
		},
	},
	{
		displayName: 'Record ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the record (without the table prefix)',
		displayOptions: {
			show: {
				resource: [
					'record',
				],
				operation: [
					'getRecord',
					'updateRecord',
					'mergeRecord',
					'deleteRecord',
					'upsertRecord',
				],
			},
		},
	},
	
	// Data field for operations that require data input
	{
		displayName: 'Data (JSON)',
		name: 'data',
		type: 'json',
		required: true,
		default: '{}',
		description: 'Data to create or update the record with',
		displayOptions: {
			show: {
				resource: [
					'record',
				],
				operation: [
					'createRecord',
					'updateRecord',
					'mergeRecord',
					'upsertRecord',
				],
			},
		},
	},
	
	// ----------------------------------
	//         Table Resource
	// ----------------------------------
	
	// Fields for Table operations
	{
		displayName: 'Records Data (JSON)',
		name: 'data',
		type: 'json',
		required: true,
		default: '[]',
		description: 'Array of record objects to create',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'createMany',
				],
			},
		},
	},
	{
		displayName: 'Record IDs',
		name: 'ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'id1,id2,id3',
		description: 'Comma-separated list of record IDs (without the table prefix)',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'getMany',
				],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for retrieving records',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'getAllRecords',
				],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 100,
				description: 'Maximum number of records to return',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'Number of records to skip',
			},
		],
	},
	
	// ----------------------------------
	//         Query Resource
	// ----------------------------------
	
	// Fields for Query operations
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				resource: [
					'query',
				],
				operation: [
					'executeQuery',
				],
			},
		},
		default: '',
		placeholder: 'SELECT * FROM person WHERE age > $age',
		required: true,
		description: 'SurrealQL query to execute',
	},
	{
		displayName: 'Parameters (JSON)',
		name: 'parameters',
		type: 'json',
		displayOptions: {
			show: {
				resource: [
					'query',
				],
				operation: [
					'executeQuery',
				],
			},
		},
		default: '{}',
		placeholder: '{ "age": 18 }',
		description: 'Parameters for the query as a JSON object',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for query execution',
		displayOptions: {
			show: {
				resource: [
					'query',
				],
				operation: [
					'executeQuery',
				],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 100,
				description: 'Maximum number of records to return (only applied if query doesn\'t already have LIMIT)',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'Number of records to skip (only applied if query doesn\'t already have START)',
			},
		],
	},

	// ----------------------------------
	//         System Resource
	// ----------------------------------
	
	// No additional fields needed for System operations
];
