import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult } from '../../../utilities';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to false to disable debug logging
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
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get parameters for the specific item
			let table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			
			// Ensure table is a string
			table = String(table || '');
			
			// If table contains a colon, use only the part before the colon
			if (table.includes(':')) {
				table = table.split(':')[0];
			}
			
			// Build the delete query
			// We use DELETE with no WHERE clause to delete all records in the table
			let query = `DELETE FROM ${table}`;
			
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
				// DEBUG: Log original query and credentials
				console.log('DEBUG - Delete All Records - Original query:', query);
				console.log('DEBUG - Delete All Records - Authentication type:', resolvedCredentials.authentication);
				console.log('DEBUG - Delete All Records - Namespace:', resolvedCredentials.namespace);
				console.log('DEBUG - Delete All Records - Database:', resolvedCredentials.database);
			}
			
			// Prepare the query based on authentication type
			query = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log modified query
				console.log('DEBUG - Delete All Records - Modified query:', query);
			}
			
			// Execute the query
			const result = await client.query<[any[]]>(query);
			
			if (DEBUG) {
				// DEBUG: Log raw result
				console.log('DEBUG - Delete All Records - Raw query result:', JSON.stringify(result));
			}
			
			// Find the first non-null array in the result
			const recordsArray = Array.isArray(result) ? result.find(item => Array.isArray(item)) : null; // Find first array, even if empty
			
			if (recordsArray) { // Check if an array was found (could be empty)
				// Format the results
				const records = recordsArray;
				const formattedResults = formatArrayResult(records); // formatArrayResult([]) returns []
				
				const returnData: INodeExecutionData[] = [];
				
				// Add each record as a separate item
				for (const formattedResult of formattedResults) {
					returnData.push({
						...formattedResult,
						pairedItem: { item: itemIndex },
					});
				}
				
				return returnData;
			} else {
				// If no records were deleted or the result is not as expected, return a status message
				return [{
					json: { 
						result: 'Delete operation completed',
						table
					},
					pairedItem: { item: itemIndex },
				}];
			}
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				return [{
					json: { error: error.message },
					pairedItem: { item: itemIndex },
				}];
			}
			throw error;
		}
	},
};