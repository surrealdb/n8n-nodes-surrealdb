import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField, buildCredentialsObject, checkQueryResult } from '../../../GenericFunctions';
import { debugLog } from '../../../utilities';
import type { IOperationHandler } from '../../../types/operation.types';

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
		
		if (DEBUG) debugLog('dropIndex', 'Starting operation', itemIndex);
		
		try {
			if (DEBUG) debugLog('dropIndex', 'Processing item', itemIndex);
			
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
			
			// Build credentials object
			const resolvedCredentials = buildCredentialsObject(credentials, options);
			
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log query
				debugLog('dropIndex', 'Prepared query', itemIndex, preparedQuery);
			}
			
			// Execute the query
			const result = await client.query(preparedQuery);
			
			if (DEBUG) {
				// DEBUG: Log raw result
				debugLog('dropIndex', 'Raw query result', itemIndex, JSON.stringify(result));
			}

			// Check if the result contains an error
			const resultCheck = checkQueryResult(result, `Error dropping index`, itemIndex);
			
			if (resultCheck.success) {
				// No error, operation succeeded - return result WITH standard result format
				if (DEBUG) debugLog('dropIndex', 'Success for item', itemIndex);
				returnData.push({
					json: {
						result: {
							index: indexName,
							table,
							message: `Index ${indexName} has been dropped from table ${table}`
						}
					},
					pairedItem: { item: itemIndex },
				});
			} else {
				// Handle error based on continueOnFail setting
				if (executeFunctions.continueOnFail()) {
					if (DEBUG) debugLog('dropIndex', 'Error in result with continueOnFail enabled', itemIndex, resultCheck.errorMessage);
					// Add error information to output
					returnData.push({
						json: { error: resultCheck.errorMessage },
						pairedItem: { item: itemIndex },
					});
				} else {
					// If continueOnFail is not enabled, throw a properly formatted NodeOperationError
					if (DEBUG) debugLog('dropIndex', 'Error in result, stopping execution', itemIndex, resultCheck.errorMessage);
					throw new NodeOperationError(
						executeFunctions.getNode(),
						resultCheck.errorMessage || 'Unknown error',
						{ itemIndex }
					);
				}
			}
		} catch (error) {
			// Handle errors based on continueOnFail setting
			if (executeFunctions.continueOnFail()) {
				if (DEBUG) debugLog('dropIndex', 'Error with continueOnFail enabled', itemIndex, error.message);
				// Add error information to output
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: itemIndex },
				});
			} else {
				// If continueOnFail is not enabled, throw a properly formatted NodeOperationError
				if (DEBUG) debugLog('dropIndex', 'Error, stopping execution', itemIndex, error.message);
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error dropping index: ${error.message}`,
					{ itemIndex }
				);
			}
		}
		
		if (DEBUG) debugLog('dropIndex', `Completed, returning ${returnData.length} items`);
		return returnData;
	},
};