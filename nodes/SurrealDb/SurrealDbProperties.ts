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
				action: 'Create record',
			},
			{
				name: 'Get',
				value: 'getRecord',
				description: 'Retrieve a specific record',
				action: 'Get record',
			},
			{
				name: 'Update',
				value: 'updateRecord',
				description: 'Replace the content of a specific record',
				action: 'Update record',
			},
			{
				name: 'Merge',
				value: 'mergeRecord',
				description: 'Merge data into a specific record',
				action: 'Merge record',
			},
			{
				name: 'Delete',
				value: 'deleteRecord',
				description: 'Delete a specific record',
				action: 'Delete record',
			},
			{
				name: 'Upsert',
				value: 'upsertRecord',
				description: 'Create a record if it doesn\'t exist, or update it if it does',
				action: 'Upsert record',
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
				action: 'Get all records',
			},
			{
				name: 'Create Many',
				value: 'createMany',
				description: 'Create multiple records in a single operation',
				action: 'Create many records',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Retrieve multiple specific records by their IDs',
				action: 'Get many records',
			},
			{
				name: 'Update All Records',
				value: 'updateAllRecords',
				description: 'Update all records in a table with the same data',
				action: 'Update all records',
			},
			{
				name: 'Delete All Records',
				value: 'deleteAllRecords',
				description: 'Delete all records in a table',
				action: 'Delete all records',
			},
			{
				name: 'Merge All Records',
				value: 'mergeAllRecords',
				description: 'Merge the same data into all records in a table',
				action: 'Merge all records',
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
				action: 'Execute SurrealQL query',
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
				action: 'Check health',
			},
			{
				name: 'Version',
				value: 'version',
				description: 'Get the version of the SurrealDB instance',
				action: 'Get SurrealDB version',
			},
		],
		default: 'healthCheck',
	},

	// Common fields for Record and Table resources
	// Table field for operations that don't use Record IDs
	{
		displayName: 'Table',
		name: 'table',
		type: 'string',
		required: true,
		default: '',
		description: 'SurrealDB table name (e.g., "person", "product", "order"). You can also use a full record ID (e.g., "person:john") and the table part will be extracted automatically.',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'getAllRecords',
					'createMany',
					'updateAllRecords',
					'deleteAllRecords',
					'mergeAllRecords',
				],
			},
		},
	},
	// Table field for operations that use Record IDs (optional)
	{
		displayName: 'Table',
		name: 'table',
		type: 'string',
		required: false,
		default: '',
		description: 'SurrealDB table name (e.g., "person", "product"). You can also use a full record ID (e.g., "person:john") and the table part will be extracted automatically. Optional if Record ID includes a table prefix.',
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
	// Table field for getMany operation (optional)
	{
		displayName: 'Table',
		name: 'table',
		type: 'string',
		required: false,
		default: '',
		description: 'SurrealDB table name (e.g., "person", "product"). You can also use a full record ID (e.g., "person:john") and the table part will be extracted automatically. Optional if Record IDs include a table prefix.',
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
		displayName: 'Record ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the record. Can include table prefix (e.g., "person:john", "product:abc123"). If Table field is empty, the table part will be extracted from the Record ID.',
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
		displayName: 'Update Data (JSON)',
		name: 'data',
		type: 'json',
		required: true,
		default: '{}',
		description: 'Data to update all records in the table with',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'updateAllRecords',
				],
			},
		},
	},
	{
		displayName: 'Merge Data (JSON)',
		name: 'data',
		type: 'json',
		required: true,
		default: '{}',
		description: 'Data to merge into all records in the table',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'mergeAllRecords',
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
		placeholder: 'id1,id2,id3 or table:id1,table:id2,table:id3',
		description: 'Comma-separated list of record IDs. Can include table prefix (e.g., "person:john", "product:abc123"). If Table field is empty, the table part will be extracted from the Record IDs.',
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

	// ----------------------------------
	//         System Resource
	// ----------------------------------
	
	// Add Options for System resource
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for system operations',
		displayOptions: {
			show: {
				resource: [
					'system',
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
	
	// Add Options for Record resource
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for record operations',
		displayOptions: {
			show: {
				resource: [
					'record',
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
	
	// Add Options for Table resource (createMany and getMany operations)
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for table operations',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'createMany',
					'getMany',
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
	// Add Options for updateAllRecords operation
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for updating all records',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'updateAllRecords',
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
	// Add Options for deleteAllRecords operation
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for deleting all records',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'deleteAllRecords',
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
	// Add Options for mergeAllRecords operation
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description: 'Additional options for merging data into all records',
		displayOptions: {
			show: {
				resource: [
					'table',
				],
				operation: [
					'mergeAllRecords',
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
