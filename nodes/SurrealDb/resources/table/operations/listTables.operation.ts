import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "List Tables" operation
 * This operation lists all available tables in the database
 */
export const listTablesOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];
		
		// Process each item
		for (let i = 0; i < items.length; i++) {
			try {
				// Get credentials
				const credentials = await executeFunctions.getCredentials('surrealDbApi');
				
				// Get options
				const options = executeFunctions.getNodeParameter('options', i, {}) as IDataObject;
				
				// Get namespace/database overrides
				const nodeNamespace = (options.namespace as string)?.trim() || '';
				const nodeDatabase = (options.database as string)?.trim() || '';
				
				// Build the resolved credentials object
				const resolvedCredentials: ISurrealCredentials = {
					connectionString: credentials.connectionString as string,
					authentication: credentials.authentication as 'Root' | 'Namespace' | 'Database',
					username: credentials.username as string,
					password: credentials.password as string,
					namespace: nodeNamespace || (credentials.namespace as string),
					database: nodeDatabase || (credentials.database as string),
				};
				
				// Build the query to list all tables
				const query = 'INFO FOR DB;';
				const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
				
				if (DEBUG) {
					console.log('DEBUG - List Tables query:', preparedQuery);
				}
				
				// Execute the query
				const result = await client.query(preparedQuery);
				
				if (DEBUG) {
					console.log('DEBUG - Raw query result:', JSON.stringify(result));
				}
				
				// Process the result based on the observed structure in debug output
				if (Array.isArray(result) && result.length > 0 && result[0]) {
					const dbInfo = result[0];
					
					// Check for tables property as observed in the debug output
					if (dbInfo.tables && typeof dbInfo.tables === 'object') {
						// Get table names (the keys of the tables object)
						const tableNames = Object.keys(dbInfo.tables);
						
						if (tableNames.length > 0) {
							// Add each table as a separate item
							for (const tableName of tableNames) {
								// Get the table definition string from the value
								const tableDefinition = dbInfo.tables[tableName];
								
								// Parse the table type from the definition string
								// Format is typically "DEFINE TABLE [name] TYPE [type] ..."
								let tableType = 'NORMAL';
								if (typeof tableDefinition === 'string') {
									const typeMatch = tableDefinition.match(/TYPE\s+(\w+)/i);
									if (typeMatch && typeMatch[1]) {
										tableType = typeMatch[1];
									}
								}
								
								returnData.push({
									json: {
										name: tableName,
										type: tableType
									},
									pairedItem: { item: i },
								});
							}
						} else {
							// No tables found
							returnData.push({
								json: { message: 'No tables found in the database' },
								pairedItem: { item: i },
							});
						}
					} else {
						// No tables property in the result
						returnData.push({
							json: { message: 'No tables found in the database structure' },
							pairedItem: { item: i },
						});
					}
				} else {
					// Unexpected result structure
					returnData.push({
						json: { message: 'Unexpected database response structure' },
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (executeFunctions.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}
		
		return returnData;
	},
};