import type {
	IExecuteFunctions,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';

import {
	buildParameterizedConnString,
	connectSurrealClient,
	prepareFields,
	prepareItems,
	validateAndResolveSurrealCredentials,
	validateJSON,
	validateRequiredField,
} from './GenericFunctions';
import type { ISurrealParametricCredentials } from './surrealDb.types';
import { nodeProperties } from './SurrealDbProperties';
import { generatePairedItemData, createRecordId, formatSingleResult, formatArrayResult } from './utilities';

export class SurrealDb implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SurrealDB',
		name: 'surrealDb',
		icon: 'file:surrealdb.svg',
		group: ['input'],
		version: 1,
		description: 'Create, read, update and delete records in SurrealDB',
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
				testedBy: 'surrealDbCredentialTest',
			},
		],
		properties: nodeProperties,
	};

	methods = {
		credentialTest: {
			async surrealDbCredentialTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as IDataObject;

				try {
					console.log('Testing SurrealDB credentials:', {
						configurationType: credentials.configurationType,
						connectionString: credentials.configurationType === 'connectionString' ? 
							credentials.connectionString : undefined,
						host: credentials.configurationType === 'values' ? credentials.host : undefined,
						port: credentials.configurationType === 'values' ? credentials.port : undefined,
						protocol: credentials.configurationType === 'values' ? credentials.protocol : undefined,
						namespace: credentials.namespace,
						database: credentials.database,
						user: credentials.user,
						password: credentials.password, // Show actual password for debugging
					});

					const database = ((credentials.database as string) || '').trim();
					const namespace = ((credentials.namespace as string) || '').trim();
					let connectionString = '';

					if (credentials.configurationType === 'connectionString') {
						connectionString = ((credentials.connectionString as string) || '').trim();
					} else {
						connectionString = buildParameterizedConnString(
							credentials as unknown as ISurrealParametricCredentials,
						);
					}

					console.log('Using connection string:', connectionString);

					const client = await connectSurrealClient(
						connectionString,
						namespace,
						database,
						credentials.user as string,
						credentials.password as string
					);

					// Test connection by executing a simple query
					console.log('Executing test query: INFO FOR DB');
					await client.query('INFO FOR DB');
					
					// Close the connection
					console.log('Closing connection');
					await client.close();
				} catch (error) {
					console.error('SurrealDB credential test failed:', error);
					return {
						status: 'Error',
						message: (error as Error).message,
					};
				}
				console.log('SurrealDB credential test successful');
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('surrealDbApi');
		const { connectionString, namespace, database, user, password } = validateAndResolveSurrealCredentials(this, credentials);

		console.log('Executing operation with credentials:', {
			connectionString,
			namespace,
			database,
			user,
			password, // Show actual password for debugging
		});

		const client = await connectSurrealClient(connectionString, namespace, database, user, password);

		let returnData: INodeExecutionData[] = [];

		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		console.log('Operation:', operation);

		let itemsLength = items.length;
		const fallbackPairedItems = generatePairedItemData(items.length);

		try {
			if (operation === 'query') {
				for (let i = 0; i < itemsLength; i++) {
					try {
						// Validate that the query is not empty
						const query = this.getNodeParameter('query', i) as string;
						validateRequiredField(this, query, 'Query', i);
						
						// Check if parameters are provided
						const parametersString = this.getNodeParameter('parameters', i, '{}') as string;
						
						// Validate that parameters are valid JSON if provided
						const parameters = validateJSON(this, parametersString, i);
						
						// Execute the query with or without parameters
						let result;
						if (Object.keys(parameters).length > 0) {
							result = await client.query(query, parameters);
						} else {
							result = await client.query(query);
						}
						
						// Format the results
						if (Array.isArray(result)) {
							// For array results, return each item as a separate n8n item
							const formattedResults = formatArrayResult(result);
							for (const formattedResult of formattedResults) {
								returnData.push({
									...formattedResult,
									pairedItem: { item: i },
								});
							}
						} else {
							// For single results, use the formatSingleResult function
							const formattedResult = formatSingleResult(result);
							returnData.push({
								...formattedResult,
								pairedItem: { item: i },
							});
						}
					} catch (error) {
						if (this.continueOnFail()) {
							returnData.push({
								json: { error: (error as JsonObject).message },
								pairedItem: { item: i },
							});
							continue;
						}
						throw error;
					}
				}
			}

			if (operation === 'delete') {
				for (let i = 0; i < itemsLength; i++) {
					try {
						const table = this.getNodeParameter('table', i) as string;
						// Get the query but use it to construct a WHERE clause in a future version
						
						const result = await client.delete(table);
						
						returnData.push({
							json: { result },
							pairedItem: { item: i },
						});
					} catch (error) {
						if (this.continueOnFail()) {
							returnData.push({
								json: { error: (error as JsonObject).message },
								pairedItem: { item: i },
							});
							continue;
						}
						throw error;
					}
				}
			}

			if (operation === 'select') {
				for (let i = 0; i < itemsLength; i++) {
					try {
						const table = this.getNodeParameter('table', i) as string;
						const query = JSON.parse(this.getNodeParameter('query', i) as string) as IDataObject;
						
						const options = this.getNodeParameter('options', i) as IDataObject;
						const limit = options.limit as number;
						const start = options.start as number;
						
						let result;
						
						if (Object.keys(query).length === 0) {
							// If no query is provided, select all records
							result = await client.select(table);
						} else {
							// If query is provided, use it
							result = await client.query(`SELECT * FROM ${table} WHERE ${JSON.stringify(query).replace(/[{}]/g, '')}`);
						}
						
						// Apply limit and start if provided
						if (Array.isArray(result) && result.length > 0) {
							if (start > 0) {
								result = result.slice(start);
							}
							
							if (limit > 0) {
								result = result.slice(0, limit);
							}
						}
						
						if (Array.isArray(result)) {
							for (const entry of result) {
								returnData.push({ json: entry as IDataObject, pairedItem: { item: i } });
							}
						} else {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} catch (error) {
						if (this.continueOnFail()) {
							returnData.push({
								json: { error: (error as JsonObject).message },
								pairedItem: { item: i },
							});
							continue;
						}
						throw error;
					}
				}
			}

			if (operation === 'create') {
				const fields = prepareFields(this.getNodeParameter('fields', 0) as string);
				const useDotNotation = this.getNodeParameter('options.useDotNotation', 0, false) as boolean;
				const dateFields = prepareFields(
					this.getNodeParameter('options.dateFields', 0, '') as string,
				);

				const insertItems = prepareItems(items, fields, '', useDotNotation, dateFields);
				const table = this.getNodeParameter('table', 0) as string;

				let responseData: IDataObject[] = [];
				
				for (const item of insertItems) {
					try {
						const result = await client.create(table, item);
						responseData.push(result as unknown as IDataObject);
					} catch (error) {
						if (this.continueOnFail()) {
							responseData.push({ error: (error as JsonObject).message });
							continue;
						}
						throw error;
					}
				}

				returnData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: fallbackPairedItems },
				);
			}

			if (operation === 'update') {
				// Validate required fields
				const table = this.getNodeParameter('table', 0) as string;
				validateRequiredField(this, table, 'Table', 0);
				
				const updateKey = ((this.getNodeParameter('updateKey', 0) as string) || '').trim();
				validateRequiredField(this, updateKey, 'Update Key', 0);
				
				const fields = prepareFields(this.getNodeParameter('fields', 0) as string);
				validateRequiredField(this, fields.join(','), 'Fields', 0);
				
				const useDotNotation = this.getNodeParameter('options.useDotNotation', 0, false) as boolean;
				const dateFields = prepareFields(
					this.getNodeParameter('options.dateFields', 0, '') as string,
				);

				const updateItems = prepareItems(items, fields, updateKey, useDotNotation, dateFields);
				
				let responseData: IDataObject[] = [];
				
				for (const item of updateItems) {
					try {
						const updateKeyValue = item[updateKey];
						delete item[updateKey];
						
						// Use createRecordId to generate the record ID
						const recordId = createRecordId(table, updateKeyValue as string);
						
						// Execute the update operation
						const result = await client.update(recordId, item);
						
						// Format the result
						responseData.push(result as unknown as IDataObject);
					} catch (error) {
						if (this.continueOnFail()) {
							responseData.push({ error: (error as JsonObject).message });
							continue;
						}
						throw error;
					}
				}

				// Format the output using the helpers
				returnData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: fallbackPairedItems },
				);
			}
		} finally {
			// Always close the connection
			await client.close();
		}

		return [returnData];
	}
}
