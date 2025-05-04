import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = true;

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
		console.log("DEBUGGING: Starting createTableOperation execution");
		const returnData: INodeExecutionData[] = [];
		
		// Ensure we have at least one item
		if (items.length === 0) {
			console.log("DEBUGGING: No items found, adding a default item");
			returnData.push({
				json: { debug: "No input items, processed with default" },
				pairedItem: { item: 0 },
			});
			return returnData;
		}
		
		// Process each item
		for (let i = 0; i < items.length; i++) {
			try {
				console.log(`DEBUGGING: Processing item ${i}`);
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
				
				// Check if the result contains an error
				const errorResult = Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === 'object' && 'error' in result[0];
				
				if (errorResult) {
					// Use NodeOperationError for SurrealDB query errors
					throw new NodeOperationError(
						executeFunctions.getNode(),
						`Error creating table: ${String(result[0].error)}`,
						{ itemIndex: i }
					);
				}
				
				// Add the result to the returnData
				returnData.push({
					json: {
						success: true,
						table,
						message: `Table ${table} created successfully.`,
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
		
		console.log(`DEBUGGING: Finished processing, returning ${returnData.length} items`);
		console.log(`DEBUGGING: Return data: ${JSON.stringify(returnData)}`);
		
		// Emergency safety - ensure we always return at least one item
		if (returnData.length === 0) {
			console.log("DEBUGGING: No items in returnData, adding a fallback item");
			returnData.push({
				json: { 
					debug: "Failed to process input but returning fallback item",
					success: false,
					message: "Operation completed with no results" 
				},
				pairedItem: { item: 0 },
			});
		}
		
		return returnData;
	},
};