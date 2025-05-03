import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult } from '../../../utilities';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Get All Records" operation
 */
export const getAllRecordsOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];
		
		// Process each item to retrieve all records for the specified table
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
				const limit = options.limit as number;
				const start = options.start as number || 0;
				
				// Build the query with pagination, interpolating the table name directly
				// Table names usually cannot be parameterized in SQL-like languages
				let query = `SELECT * FROM ${table}`;
				
				// Only add LIMIT and START if explicitly provided
				const queryParams: Record<string, any> = {};
				
				if (limit !== undefined) {
					query += ` LIMIT $limit`;
					queryParams.limit = limit;
				}
				
				if (start > 0) {
					query += ` START $start`;
					queryParams.start = start;
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
				
				if (DEBUG) {
					// DEBUG: Log original query and credentials
					console.log('DEBUG - Original query:', query);
					console.log('DEBUG - Authentication type:', resolvedCredentials.authentication);
					console.log('DEBUG - Namespace:', resolvedCredentials.namespace);
					console.log('DEBUG - Database:', resolvedCredentials.database);
				}
				
				query = prepareSurrealQuery(query, resolvedCredentials);
				
				if (DEBUG) {
					// DEBUG: Log modified query
					console.log('DEBUG - Modified query:', query);
					console.log('DEBUG - Query params:', queryParams);
				}
				
				// Execute the query
				// Provide generic type argument for expected result structure: [any[]] - An array containing the array of records
				const result = await client.query<[any[]]>(query, queryParams);
				
				if (DEBUG) {
					// DEBUG: Log raw result
					console.log('DEBUG - Raw query result:', JSON.stringify(result));
					
					// The result from client.query is an array, where each element corresponds to a statement.
					// For queries with USE statements, the first element (result[0]) is null and the second element (result[1]) contains the records.
					console.log('DEBUG - Result structure:', JSON.stringify(result.map(r => typeof r)));
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
				// If recordsArray is null (e.g., query error before finding an array), do nothing.
				// If recordsArray is [], formatArrayResult([]) returns [], loop doesn't run, returnData is unchanged.
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