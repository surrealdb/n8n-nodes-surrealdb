import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

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
		
		if (DEBUG) console.log("DEBUG - Drop Index: Starting operation for item", itemIndex);
		
		try {
			if (DEBUG) console.log(`DEBUG - Drop Index: Processing item ${itemIndex}`);
			
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get parameters
			const table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			const indexName = executeFunctions.getNodeParameter('indexName', itemIndex) as string;
			
			// Validate required fields
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			validateRequiredField(executeFunctions, indexName, 'Index Name', itemIndex);
			
			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
			
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
				// If there's an error in the SurrealDB response, throw a NodeOperationError
				// This will be caught by our try/catch block
				if (DEBUG) console.log(`DEBUG - Drop Index: Error detected in response: ${String(result[0].error)}`);
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error dropping index: ${String(result[0].error)}`,
					{ itemIndex }
				);
			}
			
			// No error, operation succeeded - return result WITHOUT success field
			if (DEBUG) console.log(`DEBUG - Drop Index: Success for item ${itemIndex}`);
			returnData.push({
				json: {
					index: indexName,
					table,
					message: `Index ${indexName} has been dropped from table ${table}`
				},
				pairedItem: { item: itemIndex },
			});
		} catch (error) {
			// Handle errors based on continueOnFail setting
			if (executeFunctions.continueOnFail()) {
				if (DEBUG) console.log(`DEBUG - Drop Index: Error for item ${itemIndex} with continueOnFail enabled:`, error.message);
				// Add error information to output
				returnData.push({
					json: { 
						error: error.message,
					},
					pairedItem: { item: itemIndex },
				});
			} else {
				// If continueOnFail is not enabled, re-throw to stop execution
				if (DEBUG) console.log(`DEBUG - Drop Index: Error for item ${itemIndex}, stopping execution:`, error.message);
				throw error;
			}
		}
		
		if (DEBUG) console.log(`DEBUG - Drop Index: Completed, returning ${returnData.length} items`);
		return returnData;
	},
};