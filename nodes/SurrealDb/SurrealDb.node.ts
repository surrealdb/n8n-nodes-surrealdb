import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

import {
	connectSurrealClient,
	validateAndResolveSurrealCredentials,
} from './GenericFunctions';
import { nodeProperties } from './SurrealDbProperties';

// Import the new resource handlers
import { handleSystemOperations } from './resources/system';
import { handleQueryOperations } from './resources/query';
import { handleRecordOperations } from './resources/record';
import { handleTableOperations } from './resources/table';
import { handleFieldOperations } from './resources/field';
import { handleIndexOperations } from './resources/index';
import { handleRelationshipOperations } from './resources/relationship';

export class SurrealDb implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SurrealDB',
		name: 'surrealDb',
		icon: 'file:surrealdb.svg',
		group: ['input'],
		version: 1,
		description: 'Interaction with a SurrealDB database',
		defaults: {
			name: 'SurrealDB',
		},
		inputs: ['main'] as any,
		outputs: ['main'] as any,
		usableAsTool: true,
		credentials: [
			{
				name: 'surrealDbApi',
				required: true,
			},
		],
		properties: nodeProperties,
	};

	// No custom credential test method needed as we're using the standard n8n credential test
	methods = {};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('surrealDbApi');

		// Get options for the current operation to retrieve potential namespace/database overrides
		const options = this.getNodeParameter('options', 0, {}) as IDataObject;
		const nodeNamespace = (options.namespace as string)?.trim() || '';
		const nodeDatabase = (options.database as string)?.trim() || '';

		// Resolve credentials, passing in overrides
		const resolvedCredentials = validateAndResolveSurrealCredentials(
			this,
			credentials,
			nodeNamespace, // Pass the renamed variable
			nodeDatabase, // Pass the renamed variable
		);

		if (DEBUG) {
			console.log('DEBUG - Resolved Credentials:', JSON.stringify(resolvedCredentials));
		}

		const client = await connectSurrealClient(resolvedCredentials);

		let returnData: INodeExecutionData[] = [];

		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		try {
			// Use our resource handlers for all resources
			if (resource === 'system') {
				returnData = await handleSystemOperations(operation, client, items, this);
			}
			// Resource: Record
			else if (resource === 'record') {
				returnData = await handleRecordOperations(operation, client, items, this);
			}
			// Resource: Table
			else if (resource === 'table') {
				returnData = await handleTableOperations(operation, client, items, this);
			}
			// Resource: Query
			else if (resource === 'query') {
				returnData = await handleQueryOperations(operation, client, items, this);
			}
			// Resource: Field
			else if (resource === 'field') {
				returnData = await handleFieldOperations(operation, client, items, this);
			}
			// Resource: Index
			else if (resource === 'index') {
				returnData = await handleIndexOperations(operation, client, items, this);
			}
			// Resource: Relationship
			else if (resource === 'relationship') {
				returnData = await handleRelationshipOperations(operation, client, items, this);
			}
		} finally {
			// Always close the connection
			await client.close();
		}

		return [returnData];
	}
}