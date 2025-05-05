import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult, parseAndValidateRecordId, debugLog, addErrorResult } from '../../../utilities';
import { prepareSurrealQuery, validateRequiredField, cleanTableName } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Get Many Records" operation
 */
export const getManyOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];
		
		try {
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get parameters
			let table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			const idsString = executeFunctions.getNodeParameter('ids', itemIndex) as string;
			
			// Clean and standardize the table name
			table = cleanTableName(table);
			
			// Ensure idsString is a string
			const idsStringStr = String(idsString || '');
			
			// If no table is specified but idsString has a table prefix, use the extracted table from the first ID
			if (!table && idsStringStr.includes(':')) {
				const firstId = idsString.split(',')[0]?.trim();
				if (firstId && firstId.includes(':')) {
					table = firstId.split(':')[0];
				}
			}
			
			// Only validate table as required if it couldn't be extracted from the Record IDs
			if (!table) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'Either Table field must be provided or Record IDs must include a table prefix (e.g., "table:id")',
					{ itemIndex }
				);
			}
			validateRequiredField(executeFunctions, idsString, 'Record IDs', itemIndex);
			
			// Parse the comma-separated IDs
			const ids = idsString.split(',').map(id => id?.trim() || '').filter(id => id !== '');
			
			if (ids.length === 0) {
				// If no valid IDs provided after filtering, return empty
				return returnData;
			}
			
			// We need to use a query to select multiple records by ID
			// Build a list of full Record IDs for the IN clause, joined by comma ONLY
			const recordIdList = ids.map(id => {
				// Ensure id is a string before validation
				const idStr = String(id);
				// Validate each individual ID before adding to the list
				const validatedId = parseAndValidateRecordId(idStr, table, executeFunctions.getNode(), itemIndex);
				return `${table}:${validatedId}`;
			}).join(',');
			
			// Build the query string with the Record IDs directly interpolated
			let query = `SELECT * FROM ${table} WHERE id IN [${recordIdList}]`;
			
			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
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
			
			if (DEBUG) {
				debugLog('getMany', 'Original query', itemIndex, query);
				debugLog('getMany', 'Authentication type', itemIndex, resolvedCredentials.authentication);
				debugLog('getMany', 'Namespace', itemIndex, resolvedCredentials.namespace);
				debugLog('getMany', 'Database', itemIndex, resolvedCredentials.database);
				debugLog('getMany', 'Record IDs', itemIndex, recordIdList);
			}
			
			// Prepare the query based on authentication type
			query = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				debugLog('getMany', 'Modified query', itemIndex, query);
			}
			
			// Execute the query (no parameters needed for IDs now)
			const result = await client.query<[any[]]>(query);
			
			if (DEBUG) {
				debugLog('getMany', 'Raw query result', itemIndex, JSON.stringify(result));
			}
			
			// Check for errors in the result
			if (result === null || result === undefined) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'Query execution failed: No result returned',
					{ itemIndex }
				);
			}
			
			// Check for error responses in the query result
			if (Array.isArray(result)) {
				for (const resultItem of result) {
					if (resultItem && typeof resultItem === 'object') {
						// Check status error format
						if ('status' in resultItem && resultItem.status === 'ERR') {
							const errorDetail = 'detail' in resultItem ? resultItem.detail : 'Unknown error';
							throw new NodeOperationError(
								executeFunctions.getNode(),
								`Query execution error: ${errorDetail}`,
								{ itemIndex }
							);
						}
						
						// Check error property format
						if ('error' in resultItem && resultItem.error) {
							throw new NodeOperationError(
								executeFunctions.getNode(),
								`Query execution error: ${resultItem.error}`,
								{ itemIndex }
							);
						}
					}
				}
			}
			
			// Find the first non-null array in the result
			const recordsArray = Array.isArray(result) ? result.find(item => Array.isArray(item)) : null;
			
			if (recordsArray && recordsArray.length > 0) {
				// Format the results
				const formattedResults = formatArrayResult(recordsArray);
				
				// Add each record as a separate item
				for (const formattedResult of formattedResults) {
					returnData.push({
						...formattedResult,
						pairedItem: { item: itemIndex },
					});
				}
			}
			// If no records found, do not add anything to returnData (standard n8n pattern)
			
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				addErrorResult(returnData, error, itemIndex);
			} else {
				throw error;
			}
		}
		
		return returnData;
	},
};