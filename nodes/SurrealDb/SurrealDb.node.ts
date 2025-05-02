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
	IHttpRequestOptions,
} from 'n8n-workflow';

import {
	buildParameterizedConnString,
	connectSurrealClient,
	validateAndResolveSurrealCredentials,
	validateJSON,
	validateRequiredField,
} from './GenericFunctions';
import type { ISurrealParametricCredentials } from './surrealDb.types';
import { nodeProperties } from './SurrealDbProperties';
import { createRecordId, formatSingleResult, formatArrayResult } from './utilities';

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

					const client = await connectSurrealClient(
						connectionString,
						namespace,
						database,
						credentials.user as string,
						credentials.password as string
					);

					// Test connection by executing a simple query
					await client.query('INFO FOR DB');
					
					// Close the connection
					await client.close();
				} catch (error) {
					// console.error('SurrealDB credential test failed:', error); // Keep error log? Maybe not needed for user.
					return {
						status: 'Error',
						message: (error as Error).message,
					};
				}
				// console.log('SurrealDB credential test successful');
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

		const client = await connectSurrealClient(connectionString, namespace, database, user, password);

		let returnData: INodeExecutionData[] = [];

		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		
		const itemsLength = items.length;

		try {
			// ----------------------------------------
			// Resource: Record
			// ----------------------------------------
			if (resource === 'record') {
				
				// Operation: Create Record
				if (operation === 'createRecord') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const dataString = this.getNodeParameter('data', i) as string;
							validateRequiredField(this, dataString, 'Data', i);
							
							// Parse and validate the data JSON
							const data = validateJSON(this, dataString, i);
							
							// Execute the create operation
							const result = await client.create(table, data);
							
							// Format the result
							const formattedResult = formatSingleResult(result);
							returnData.push({
								...formattedResult,
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
				
				// Operation: Get Record
				else if (operation === 'getRecord') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const id = this.getNodeParameter('id', i) as string;
							validateRequiredField(this, id, 'Record ID', i);
							
							// Create the record ID
							const recordId = createRecordId(table, id);
							
							// Execute the select operation
							const result = await client.select(recordId);
							
							// Format the result
							const formattedResult = formatSingleResult(result);
							returnData.push({
								...formattedResult,
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
				
				// Operation: Update Record
				else if (operation === 'updateRecord') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const id = this.getNodeParameter('id', i) as string;
							validateRequiredField(this, id, 'Record ID', i);
							
							const dataString = this.getNodeParameter('data', i) as string;
							validateRequiredField(this, dataString, 'Data', i);
							
							// Parse and validate the data JSON
							const data = validateJSON(this, dataString, i);
							
							// Create the record ID
							const recordId = createRecordId(table, id);
							
							// Execute the update operation
							const result = await client.update(recordId, data);
							
							// Format the result
							const formattedResult = formatSingleResult(result);
							returnData.push({
								...formattedResult,
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
				
				// Operation: Merge Record
				else if (operation === 'mergeRecord') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const id = this.getNodeParameter('id', i) as string;
							validateRequiredField(this, id, 'Record ID', i);
							
							const dataString = this.getNodeParameter('data', i) as string;
							validateRequiredField(this, dataString, 'Data', i);
							
							// Parse and validate the data JSON
							const data = validateJSON(this, dataString, i);
							
							// Create the record ID
							const recordId = createRecordId(table, id);
							
							// Execute the merge operation
							const result = await client.merge(recordId, data);
							
							// Format the result
							const formattedResult = formatSingleResult(result);
							returnData.push({
								...formattedResult,
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
				
				// Operation: Delete Record
				else if (operation === 'deleteRecord') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const id = this.getNodeParameter('id', i) as string;
							validateRequiredField(this, id, 'Record ID', i);
							
							// Create the record ID
							const recordId = createRecordId(table, id);
							
							// Execute the delete operation
							const result = await client.delete(recordId);
							
							// Format the result
							const formattedResult = formatSingleResult(result);
							returnData.push({
								...formattedResult,
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
				
				// Operation: Upsert Record
				else if (operation === 'upsertRecord') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const id = this.getNodeParameter('id', i) as string;
							validateRequiredField(this, id, 'Record ID', i);
							
							const dataString = this.getNodeParameter('data', i) as string;
							validateRequiredField(this, dataString, 'Data', i);
							
							// Parse and validate the data JSON
							const data = validateJSON(this, dataString, i);
							
							// Create the record ID
							const recordId = createRecordId(table, id);
							
							// For upsert, we use the update method which will create the record if it doesn't exist
							// This is the behavior specified in the PRD
							const result = await client.update(recordId, data);
							
							// Format the result
							const formattedResult = formatSingleResult(result);
							returnData.push({
								...formattedResult,
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
			}
			
			// ----------------------------------------
			// Resource: Table
			// ----------------------------------------
			else if (resource === 'table') {
				
				// Operation: Get All Records
				if (operation === 'getAllRecords') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							// Get options
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const limit = options.limit as number || 100;
							const start = options.start as number || 0;
							
							// Execute the query with pagination, interpolating the table name directly
							// Table names usually cannot be parameterized in SQL-like languages
							// Provide generic type argument for expected result structure: [any[]] - An array containing the array of records
							const result = await client.query<[any[]]>(
								`SELECT * FROM ${table} LIMIT $limit START $start`,
								{ limit, start }
							);
							
							// The result from client.query is an array, one element per statement.
							// For a single SELECT, the first element (result[0]) is the array of records.
							if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
								// Format the results
								const records = result[0];
								const formattedResults = formatArrayResult(records);
								
								// Add each record as a separate item
								for (const formattedResult of formattedResults) {
									returnData.push({
										...formattedResult,
										pairedItem: { item: i },
									});
								}
							} else {
								// If no records found or result structure is unexpected, return an empty result
								returnData.push({
									json: { result: [] },
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
				
				// Operation: Create Many
				else if (operation === 'createMany') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const dataString = this.getNodeParameter('data', i) as string;
							validateRequiredField(this, dataString, 'Records Data', i);
							
							// Parse and validate the data JSON
							const data = validateJSON(this, dataString, i);
							
							// Validate that data is an array
							if (!Array.isArray(data)) {
								throw new Error('Records Data must be a JSON array');
							}
							
							// Execute the insert operation to create multiple records
							// The insert method accepts an array of objects directly
							const result = await client.insert(table, data);
							
							// The result from client.insert with an array is expected to be an array of created records.
							if (Array.isArray(result)) {
								// Format the results
								const formattedResults = formatArrayResult(result);
								
								// Add each record as a separate item
								for (const formattedResult of formattedResults) {
									returnData.push({
										...formattedResult,
										pairedItem: { item: i },
									});
								}
							} else {
								// If no records created, return an empty result
								returnData.push({
									json: { result: [] },
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
				
				// Operation: Get Many
				else if (operation === 'getMany') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const table = this.getNodeParameter('table', i) as string;
							validateRequiredField(this, table, 'Table', i);
							
							const idsString = this.getNodeParameter('ids', i) as string;
							validateRequiredField(this, idsString, 'Record IDs', i);
							
							// Parse the comma-separated IDs
							const ids = idsString.split(',').map(id => id.trim()).filter(id => id !== '');
							
							if (ids.length === 0) {
								throw new Error('At least one Record ID is required');
							}
							
							// We need to use a query to select multiple records by ID
							// Build a list of full Record IDs for the IN clause, joined by comma ONLY
							const recordIdList = ids.map(id => createRecordId(table, id)).join(',');
							
							// Build the query string with the Record IDs directly interpolated
							const query = `SELECT * FROM ${table} WHERE id IN [${recordIdList}]`;
							
							// Execute the query (no parameters needed for IDs now)
							const result = await client.query<[any[]]>(query); 
							
							// Format the results - Check result[0] based on previous findings
							if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) { 
								const records = result[0]; // Pass the inner array
								const formattedResults = formatArrayResult(records); 
								
								// Add each record as a separate item
								for (const formattedResult of formattedResults) {
									returnData.push({
										...formattedResult,
										pairedItem: { item: i },
									});
								}
							} else {
								// If no records found or result structure is unexpected, return an empty result
								// Corrected else block from previous attempt
								returnData.push({
									json: { result: [] },
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
			}
			
			// ----------------------------------------
			// Resource: Query
			// ----------------------------------------
			else if (resource === 'query') {
				
				// Operation: Execute Query
				if (operation === 'executeQuery') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get parameters
							const query = this.getNodeParameter('query', i) as string;
							validateRequiredField(this, query, 'Query', i);
							
							// Get parameters if provided
							const parametersString = this.getNodeParameter('parameters', i, '{}') as string;
							const parameters = validateJSON(this, parametersString, i);
							
							// Get options
							const options = this.getNodeParameter('options', i, {}) as IDataObject;
							const limit = options.limit as number;
							const start = options.start as number;
							
							// Check if the query already contains LIMIT or START clauses
							const hasLimit = query.toUpperCase().includes('LIMIT');
							const hasStart = query.toUpperCase().includes('START');
							
							// Modify the query to add pagination if needed
							let finalQuery = query;
							if (limit !== undefined && !hasLimit) {
								finalQuery += ` LIMIT ${limit}`;
							}
							if (start !== undefined && !hasStart) {
								finalQuery += ` START ${start}`;
							}
							
							// Execute the query
							const result = await client.query(finalQuery, parameters);
							
							// The result is an array of arrays, where each array contains the results of a statement
							if (Array.isArray(result)) {
								// Process each result set
								for (const resultSet of result) {
									if (Array.isArray(resultSet)) {
										// For array results, return each item as a separate n8n item
										const formattedResults = formatArrayResult(resultSet);
										for (const formattedResult of formattedResults) {
											returnData.push({
												...formattedResult,
												pairedItem: { item: i },
											});
										}
									} else {
										// For single results, use the formatSingleResult function
										const formattedResult = formatSingleResult(resultSet);
										returnData.push({
											...formattedResult,
											pairedItem: { item: i },
										});
									}
								}
							} else {
								// If the result is not an array, format it as a single result
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
			}
			
			// ----------------------------------------
			// Resource: System
			// ----------------------------------------
			else if (resource === 'system') {
				
				// Operation: Health Check
				if (operation === 'healthCheck') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							// Get the base URL from the connection string
							// Remove /rpc if it exists
							let baseUrl = connectionString;
							if (baseUrl.endsWith('/rpc')) {
								baseUrl = baseUrl.slice(0, -4);
							}
							
							// Ensure the URL ends with a slash
							if (!baseUrl.endsWith('/')) {
								baseUrl += '/';
							}
							
							// Create the health check URL
							const healthUrl = `${baseUrl}health`;
							
							// Use n8n's httpRequest helper to perform a GET request
							const options: IHttpRequestOptions = {
								url: healthUrl,
								method: 'GET',
								returnFullResponse: true,
							};
							
							try {
								// Perform the health check request
								const response = await this.helpers.httpRequest(options);
								
								// Format the result
								returnData.push({
									json: {
										status: 'healthy',
										details: response,
									},
									pairedItem: { item: i },
								});
							} catch (error) {
								// Do not throw an error on failure, just return unhealthy status
								returnData.push({
									json: {
										status: 'unhealthy',
										details: (error as Error).message,
									},
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
				
				// Operation: Version
				else if (operation === 'version') {
					for (let i = 0; i < itemsLength; i++) {
						try {
							let version = 'unknown';
							let details = '';
							
							// First, attempt to get version using INFO FOR SERVER query
							try {
								const result = await client.query('INFO FOR SERVER');
								
								// Parse the version from the result
								if (Array.isArray(result) && result.length > 0 && result[0]) {
									const serverInfo = result[0];
									if (typeof serverInfo === 'object' && serverInfo !== null) {
										// Extract version from the server info
										// The exact structure depends on SurrealDB's response format
										// This might need adjustment based on actual response
										version = (serverInfo as any).version || 'unknown';
									}
								}
							} catch (queryError) {
								// If the query fails, use the /version endpoint as a fallback
								try {
									// Get the base URL from the connection string
									// Remove /rpc if it exists
									let baseUrl = connectionString;
									if (baseUrl.endsWith('/rpc')) {
										baseUrl = baseUrl.slice(0, -4);
									}
									
									// Ensure the URL ends with a slash
									if (!baseUrl.endsWith('/')) {
										baseUrl += '/';
									}
									
									// Create the version URL
									const versionUrl = `${baseUrl}version`;
									
									// Use n8n's httpRequest helper to perform a GET request
									const options: IHttpRequestOptions = {
										url: versionUrl,
										method: 'GET',
									};
									
									// Perform the version request
									const response = await this.helpers.httpRequest(options);
									
									// Extract version from response
									if (response && typeof response === 'string') {
										version = response.trim();
									} else if (response && typeof response === 'object') {
										version = (response as any).version || 'unknown';
									}
								} catch (httpError) {
									// If both methods fail, set details to the error message
									details = `Failed to retrieve version: ${(queryError as Error).message}, ${(httpError as Error).message}`;
								}
							}
							
							// Format the result
							returnData.push({
								json: {
									version,
									details,
								},
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
			}
		} finally {
			// Always close the connection
			await client.close();
		}

		return [returnData];
	}
}
