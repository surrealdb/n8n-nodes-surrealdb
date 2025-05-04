import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { formatArrayResult } from '../../../utilities';
import { validateJSON, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';

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
		try {
			// Get parameters for the specific item
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
				throw new Error('Merge Data is required');
			}
			
			// Process data based on type
			let data: any;
			if (typeof dataInput === 'string') {
				if (DEBUG) console.log(`DEBUG (mergeAllRecords) - Processing data parameter as string.`);
				data = validateJSON(executeFunctions, dataInput, itemIndex);
			} else if (typeof dataInput === 'object' && dataInput !== null) { // Check if it's a non-null object
				if (DEBUG) console.log(`DEBUG (mergeAllRecords) - Processing data parameter as object.`);
				data = dataInput;
			} else {
				throw new Error(`Merge Data must be a JSON string or a JSON object, received type: ${typeof dataInput}`);
			}
			
			if (DEBUG) {
				console.log(`DEBUG (mergeAllRecords) - Processed data:`, JSON.stringify(data));
				console.log(`DEBUG (mergeAllRecords) - Using table:`, table);
			}
			
			// Use the SDK's merge() method directly
			// This merges the data into all records in the table
			const result = await client.merge(table, data);
			
			if (DEBUG) {
				console.log('DEBUG (mergeAllRecords) - Result from merge operation:', JSON.stringify(result));
			}
			
			const formattedResults = formatArrayResult(result);
			
			// Add each record as a separate item
			const returnData: INodeExecutionData[] = formattedResults.map(formattedResult => ({
				...formattedResult,
				pairedItem: { item: itemIndex },
			}));
			
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