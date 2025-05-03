import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult, parseAndValidateRecordId } from '../../../utilities';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
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
		
		// Process each item to retrieve multiple records by their IDs
		for (let i = 0; i < items.length; i++) {
			try {
				// Get credentials
				const credentials = await executeFunctions.getCredentials('surrealDbApi');
				
				// Get parameters
				let table = executeFunctions.getNodeParameter('table', i) as string;
				const idsString = executeFunctions.getNodeParameter('ids', i) as string;
				
				// Ensure table is a string
				table = String(table || '');
				
				// If table contains a colon, use only the part before the colon
				if (table.includes(':')) {
					table = table.split(':')[0];
				}
				
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
					throw new Error('Either Table field must be provided or Record IDs must include a table prefix (e.g., "table:id")');
				}
				validateRequiredField(executeFunctions, idsString, 'Record IDs', i);
				
				// Parse the comma-separated IDs
				const ids = idsString.split(',').map(id => id?.trim() || '').filter(id => id !== '');
				
				if (ids.length === 0) {
					// If no valid IDs provided after filtering, return no results for this item
					continue; 
				}
				
				// We need to use a query to select multiple records by ID
				// Build a list of full Record IDs for the IN clause, joined by comma ONLY
				const recordIdList = ids.map(id => {
					// Ensure id is a string before validation
					const idStr = String(id);
					// Validate each individual ID before adding to the list
					const validatedId = parseAndValidateRecordId(idStr, table, executeFunctions.getNode(), i);
					return `${table}:${validatedId}`;
				}).join(',');
				
				// Build the query string with the Record IDs directly interpolated
				let query = `SELECT * FROM ${table} WHERE id IN [${recordIdList}]`;
				
				// Get options
				const options = executeFunctions.getNodeParameter('options', i, {}) as IDataObject;
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
					// DEBUG: Log original query and credentials
					console.log('DEBUG - Get Many - Original query:', query);
					console.log('DEBUG - Get Many - Authentication type:', resolvedCredentials.authentication);
					console.log('DEBUG - Get Many - Namespace:', resolvedCredentials.namespace);
					console.log('DEBUG - Get Many - Database:', resolvedCredentials.database);
					console.log('DEBUG - Get Many - Record IDs:', recordIdList);
				}
				
				// Prepare the query based on authentication type
				query = prepareSurrealQuery(query, resolvedCredentials);
				
				if (DEBUG) {
					// DEBUG: Log modified query
					console.log('DEBUG - Get Many - Modified query:', query);
				}
				
				// Execute the query (no parameters needed for IDs now)
				const result = await client.query<[any[]]>(query);
				
				if (DEBUG) {
					// DEBUG: Log raw result
					console.log('DEBUG - Get Many - Raw query result:', JSON.stringify(result));
				}
				
				// Find the first non-null array in the result
				const recordsArray = Array.isArray(result) ? result.find(item => Array.isArray(item)) : null; // Find first array, even if empty
				
				if (recordsArray) { // Check if an array was found (could be empty)
					// Format the results
					const records = recordsArray;
					const formattedResults = formatArrayResult(records); // formatArrayResult([]) returns []
					
					// Add each record as a separate item
					for (const formattedResult of formattedResults) {
						returnData.push({
							...formattedResult,
							pairedItem: { item: i },
						});
					}
				}
				// If recordsArray is null or empty, do nothing, resulting in zero items for this input item
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