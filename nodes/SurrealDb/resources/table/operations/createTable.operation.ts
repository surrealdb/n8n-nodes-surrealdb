import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Create Table" operation
 * This operation creates a new table in the database
 */
export const createTableOperation: IOperationHandler = {
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
				
				// Get parameters
				let table = executeFunctions.getNodeParameter('table', i) as string;
				validateRequiredField(executeFunctions, table, 'Table', i);
				
				// Ensure table is a string
				table = String(table || '');
				
				// If table contains a colon, use only the part before the colon
				if (table.includes(':')) {
					table = table.split(':')[0];
				}
				
				// Get options
				const options = executeFunctions.getNodeParameter('options', i, {}) as IDataObject;
				
				// Get schema if provided and convert from string if needed
				let schema = null;
				if (options.schema) {
					if (typeof options.schema === 'string') {
						try {
							schema = JSON.parse(options.schema);
						} catch (error) {
							throw new Error(`Invalid schema JSON: ${error.message}`);
						}
					} else if (typeof options.schema === 'object') {
						schema = options.schema;
					}
				}
				
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
				
				// Get table type and schema mode options
				const tableType = options.tableType as string || 'NORMAL';
				const schemaMode = options.schemaMode as string || 'SCHEMALESS';
				
				// Build the query to create a table
				let query: string;
				
				// Start with the basic DEFINE TABLE statement with the specified type
				query = `DEFINE TABLE ${table} TYPE ${tableType} ${schemaMode}`;
				
				// Add schema fields if schema is provided and mode is SCHEMAFULL
				if (schemaMode === 'SCHEMAFULL' && schema) {
					// Prepare the schema definition query
					// For each field in the schema, define its type
					if (schema.fields && Object.keys(schema.fields).length > 0) {
						for (const [fieldName, fieldType] of Object.entries(schema.fields)) {
							query += `; DEFINE FIELD ${fieldName} ON TABLE ${table} TYPE ${fieldType}`;
						}
					}
				}
				
				const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
				
				if (DEBUG) {
					// DEBUG: Log query
					console.log('DEBUG - Create Table query:', preparedQuery);
				}
				
				// Execute the query
				const result = await client.query(preparedQuery);
				
				if (DEBUG) {
					// DEBUG: Log raw result
					console.log('DEBUG - Raw query result:', JSON.stringify(result));
				}
				
				// Add the result to the returnData
				returnData.push({
					json: {
						success: true,
						table,
						message: `Table ${table} created successfully`,
					},
					pairedItem: { item: i },
				});
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