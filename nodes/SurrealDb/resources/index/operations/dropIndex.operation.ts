import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = true;

/**
 * Implementation of the "Drop Index" operation
 * This operation removes an index from a table
 */
export const dropIndexOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];
		
		// Process each item
		for (let i = 0; i < items.length; i++) {
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get parameters
			const table = executeFunctions.getNodeParameter('table', i) as string;
			const indexName = executeFunctions.getNodeParameter('indexName', i) as string;
			
			// Validate required fields
			validateRequiredField(executeFunctions, table, 'Table', i);
			validateRequiredField(executeFunctions, indexName, 'Index Name', i);
			
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
			
			// Build the query to drop the index
			let query = '';
			const ifExists = options.ifExists === true;
			
			// Try different syntax based on options
			if (options.useAlternativeSyntax === true) {
				query = `REMOVE INDEX ${ifExists ? 'IF EXISTS ' : ''}${indexName} ON ${table}`;
			} else {
				query = `REMOVE INDEX ${ifExists ? 'IF EXISTS ' : ''}${indexName} ON TABLE ${table}`;
			}
			
			// Add semicolon at the end
			query += ';';
			
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log query
				console.log('DEBUG - Drop Index query:', preparedQuery);
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
				// Always throw an error when we get an error response from SurrealDB
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error dropping index: ${String(result[0].error)}`,
					{ itemIndex: i }
				);
			}
			
			// No error, operation succeeded - return result WITHOUT success field
			returnData.push({
				json: {
					index: indexName,
					table,
					message: `Index ${indexName} has been dropped from table ${table}`
				},
				pairedItem: { item: i },
			});
		}
		
		return returnData;
	},
};