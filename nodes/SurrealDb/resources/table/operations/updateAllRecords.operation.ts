import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult } from '../../../utilities';
import { prepareSurrealQuery, validateJSON, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Update All Records" operation
 */
export const updateAllRecordsOperation: IOperationHandler = {
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
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			
			// Ensure table is a string
			table = String(table || '');
			
			// If table contains a colon, use only the part before the colon
			if (table.includes(':')) {
				table = table.split(':')[0];
			}
			
			const dataInput = executeFunctions.getNodeParameter('data', itemIndex); // Get potential object or string
			// Validate required field based on raw input
			if (dataInput === undefined || dataInput === null || dataInput === '') {
				throw new Error('Update Data is required');
			}
			
			// Process data based on type
			let data: any;
			if (typeof dataInput === 'string') {
				if (DEBUG) console.log(`DEBUG (updateAllRecords) - Processing data parameter as string.`);
				data = validateJSON(executeFunctions, dataInput, itemIndex);
			} else if (typeof dataInput === 'object' && dataInput !== null) { // Check if it's a non-null object
				if (DEBUG) console.log(`DEBUG (updateAllRecords) - Processing data parameter as object.`);
				data = dataInput;
			} else {
				throw new Error(`Update Data must be a JSON string or a JSON object, received type: ${typeof dataInput}`);
			}
			if (DEBUG) console.log(`DEBUG (updateAllRecords) - Processed data (type: ${typeof data}):`, JSON.stringify(data));
			
			// Build the update query
			// We use UPDATE with no WHERE clause to update all records in the table
			let query = `UPDATE ${table} CONTENT $data`;
			
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
				console.log('DEBUG - Update All Records - Original query:', query);
				console.log('DEBUG - Update All Records - Authentication type:', resolvedCredentials.authentication);
				console.log('DEBUG - Update All Records - Namespace:', resolvedCredentials.namespace);
				console.log('DEBUG - Update All Records - Database:', resolvedCredentials.database);
				console.log('DEBUG - Update All Records - Data:', JSON.stringify(data));
			}
			
			// Prepare the query based on authentication type
			query = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log modified query
				console.log('DEBUG - Update All Records - Modified query:', query);
			}
			
			// Execute the query with the data parameter
			const result = await client.query<[any[]]>(query, { data });
			
			if (DEBUG) {
				// DEBUG: Log raw result
				console.log('DEBUG - Update All Records - Raw query result:', JSON.stringify(result));
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
						pairedItem: { item: itemIndex },
					});
				}
			} else {
				// If no records were updated or the result is not as expected, return a status message
				returnData.push({
					json: { 
						result: 'Update operation completed',
						table,
						data
					},
					pairedItem: { item: itemIndex },
				});
			}
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: itemIndex },
				});
			} else {
				throw error;
			}
		}
		
		return returnData;
	},
};