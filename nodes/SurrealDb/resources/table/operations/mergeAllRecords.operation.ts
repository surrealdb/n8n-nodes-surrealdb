import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult } from '../../../utilities';
import { prepareSurrealQuery, validateJSON, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Merge All Records" operation
 */
export const mergeAllRecordsOperation: IOperationHandler = {
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
			
			// Get parameters for the specific item
			let table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			
			// Ensure table is a string
			table = String(table || '');
			
			// If table contains a colon, use only the part before the colon
			if (table.includes(':')) {
				table = table.split(':')[0];
			}
			
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
			
			const dataInput = executeFunctions.getNodeParameter('data', itemIndex); // Get potential object or string
			// Validate required field based on raw input
			if (dataInput === undefined || dataInput === null || dataInput === '') {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'Merge Data is required',
					{ itemIndex }
				);
			}
			
			// Process data based on type
			let data: any;
			if (typeof dataInput === 'string') {
				if (DEBUG) console.log(`DEBUG (mergeAllRecords) - Processing data parameter as string for item ${itemIndex}.`);
				data = validateJSON(executeFunctions, dataInput, itemIndex);
			} else if (typeof dataInput === 'object' && dataInput !== null) { // Check if it's a non-null object
				if (DEBUG) console.log(`DEBUG (mergeAllRecords) - Processing data parameter as object for item ${itemIndex}.`);
				data = dataInput;
			} else {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Merge Data must be a JSON string or a JSON object, received type: ${typeof dataInput}`,
					{ itemIndex }
				);
			}
			
			if (DEBUG) {
				console.log(`DEBUG (mergeAllRecords) - Processed data for item ${itemIndex}:`, JSON.stringify(data));
				console.log(`DEBUG (mergeAllRecords) - Using table for item ${itemIndex}:`, table);
			}
			
			// Build the query to merge data into all records in the table, including parameters directly in the query
			const query = `UPDATE ${table} MERGE ${JSON.stringify(data)} RETURN AFTER;`;
			
			// Prepare the query with credentials
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				console.log(`DEBUG (mergeAllRecords) - Prepared query for item ${itemIndex}:`, preparedQuery);
			}
			
			// Execute the query
			const result = await client.query(preparedQuery);
			
			if (DEBUG) {
				console.log(`DEBUG (mergeAllRecords) - Result from merge operation for item ${itemIndex}:`, JSON.stringify(result));
			}
			
			// Find the first non-null array in the result
			// This matches how other operations like getAllRecords process the result
			const recordsArray = Array.isArray(result) ? result.find(item => Array.isArray(item)) : null;
			
			if (recordsArray) {
				// Format the results - this converts each record to an object with json property
				// and adds pairedItem with the current itemIndex
				const formattedResults = formatArrayResult(recordsArray, itemIndex);
				
				// Add all formatted results to returnData
				returnData.push(...formattedResults);
			}
			
			// No special handling for empty results - return whatever came back from the database
			// If no records were affected, we return an empty array
			
			return returnData;
			
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