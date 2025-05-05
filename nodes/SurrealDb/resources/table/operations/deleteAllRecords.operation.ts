import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult, debugLog, createErrorResult } from '../../../utilities';
import { prepareSurrealQuery, validateRequiredField, cleanTableName, buildDeleteQuery, buildCredentialsObject } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Delete All Records" operation
 */
export const deleteAllRecordsOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		try {
			if (DEBUG) debugLog('deleteAllRecords', 'Starting operation', itemIndex);
			
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get parameters for the specific item
			const tableInput = executeFunctions.getNodeParameter('table', itemIndex) as string;
			validateRequiredField(executeFunctions, tableInput, 'Table', itemIndex);
			const table = cleanTableName(tableInput);
			
			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
			
			// Get where clause if provided
			const where = options.where as string || '';
			
			// Use helper function to build the query
			const query = buildDeleteQuery(table, where);
			
			// Build credentials object with overrides from options
			const resolvedCredentials = buildCredentialsObject(credentials, options);
			
			if (DEBUG) {
				// DEBUG: Log query and credentials info
				debugLog('deleteAllRecords', 'Original query', itemIndex, query);
				debugLog('deleteAllRecords', 'Authentication type', itemIndex, resolvedCredentials.authentication);
				debugLog('deleteAllRecords', 'Namespace', itemIndex, resolvedCredentials.namespace);
				debugLog('deleteAllRecords', 'Database', itemIndex, resolvedCredentials.database);
			}
			
			// Prepare the query based on authentication type
			const finalQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				debugLog('deleteAllRecords', 'Final query', itemIndex, finalQuery);
			}
			
			// Execute the query
			const result = await client.query<[any[]]>(finalQuery);
			
			if (DEBUG) {
				// DEBUG: Log raw result
				debugLog('deleteAllRecords', 'Raw query result', itemIndex, JSON.stringify(result));
			}
			
			// Find the first non-null array in the result
			const recordsArray = Array.isArray(result) ? result.find(item => Array.isArray(item)) : null; // Find first array, even if empty
			
			const returnData: INodeExecutionData[] = [];
			
			if (recordsArray) { // Check if an array was found (could be empty)
				// Format the results
				const formattedResults = formatArrayResult(recordsArray);
				
				// Add each formatted result to returnData with pairedItem
				for (const formattedResult of formattedResults) {
					returnData.push({
						...formattedResult,
						pairedItem: { item: itemIndex },
					});
				}
			}
			
			if (DEBUG) debugLog('deleteAllRecords', `Completed, returning ${returnData.length} items`, itemIndex);
			return returnData;
			
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				if (DEBUG) debugLog('deleteAllRecords', 'Error with continueOnFail enabled', itemIndex, error.message);
				return [createErrorResult(error, itemIndex)];
			}
			if (DEBUG) debugLog('deleteAllRecords', 'Error, stopping execution', itemIndex, error.message);
			throw error;
		}
	},
};