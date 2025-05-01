import type { INodeProperties } from 'n8n-workflow';

export const nodeProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a record',
				action: 'Create a record',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete records',
				action: 'Delete records',
			},
			{
				name: 'Query',
				value: 'query',
				description: 'Execute a SurrealQL query',
				action: 'Execute a SurrealQL query',
			},
			{
				name: 'Select',
				value: 'select',
				description: 'Select records',
				action: 'Select records',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update records',
				action: 'Update records',
			},
		],
		default: 'select',
	},

	{
		displayName: 'Table',
		name: 'table',
		type: 'string',
		required: true,
		default: '',
		description: 'SurrealDB table name',
		displayOptions: {
			hide: {
				operation: [
					'query',
				],
			},
		},
	},

	// ----------------------------------
	//         query
	// ----------------------------------
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				operation: [
					'query',
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
				operation: [
					'query',
				],
			},
		},
		default: '{}',
		placeholder: '{ "age": 18 }',
		description: 'Parameters for the query as a JSON object',
	},

	// ----------------------------------
	//         delete
	// ----------------------------------
	{
		displayName: 'Delete Query (JSON Format)',
		name: 'query',
		type: 'json',
		typeOptions: {
			rows: 5,
		},
		displayOptions: {
			show: {
				operation: [
					'delete',
				],
			},
		},
		default: '{}',
		placeholder: '{ "age": { ">": 18 } }',
		required: true,
		description: 'SurrealDB Delete query',
	},

	// ----------------------------------
	//         select
	// ----------------------------------
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		displayOptions: {
			show: {
				operation: [
					'select',
				],
			},
		},
		default: {},
		placeholder: 'Add option',
		description: 'Add query options',
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 0,
				description:
					'Use limit to specify the maximum number of records or 0 for unlimited records',
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'The number of records to skip in the results set',
			},
		],
	},
	{
		displayName: 'Query (JSON Format)',
		name: 'query',
		type: 'json',
		typeOptions: {
			rows: 5,
		},
		displayOptions: {
			show: {
				operation: [
					'select',
				],
			},
		},
		default: '{}',
		placeholder: '{ "age": { ">": 18 } }',
		required: true,
		description: 'SurrealDB Select query',
	},

	// ----------------------------------
	//         create
	// ----------------------------------
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'create',
				],
			},
		},
		default: '',
		placeholder: 'name,description',
		description: 'Comma-separated list of the fields to be included into the new record',
	},

	// ----------------------------------
	//         update
	// ----------------------------------
	{
		displayName: 'Update Key',
		name: 'updateKey',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'update',
				],
			},
		},
		default: 'id',
		required: true,
		description:
			'Name of the property which decides which rows in the database should be updated. Normally that would be "id".',
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'string',
		displayOptions: {
			show: {
				operation: [
					'update',
				],
			},
		},
		default: '',
		placeholder: 'name,description',
		description: 'Comma-separated list of the fields to be included into the updated record',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		displayOptions: {
			show: {
				operation: [
					'update',
					'create',
				],
			},
		},
		placeholder: 'Add option',
		default: {},
		options: [
			{
				displayName: 'Date Fields',
				name: 'dateFields',
				type: 'string',
				default: '',
				description: 'Comma-separated list of fields that will be parsed as date',
			},
			{
				displayName: 'Use Dot Notation',
				name: 'useDotNotation',
				type: 'boolean',
				default: false,
				description: 'Whether to use dot notation to access date fields',
			},
		],
	},
];
