import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateJSON } from '../../../GenericFunctions';
import { formatSingleResult } from '../../../utilities';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Create Record operation handler for Record resource
 */
export const createRecordOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];
		
		if (DEBUG) console.log("DEBUG - Create Record: Starting operation");
		
		// Process each item
		for (let i = 0; i < items.length; i++) {
			try {
				if (DEBUG) console.log(`DEBUG - Create Record: Processing item ${i}`);
				
				// Get parameters
				let table = executeFunctions.getNodeParameter('table', i) as string;
				validateRequiredField(executeFunctions, table, 'Table', i);
				
				// Ensure table is a string
				table = String(table || '');
				
				// If table contains a colon, use only the part before the colon
				if (table.includes(':')) {
					table = table.split(':')[0];
				}
				
				const dataInput = executeFunctions.getNodeParameter('data', i); // Get potential object or string
				// Validate required field based on raw input
				if (dataInput === undefined || dataInput === null || dataInput === '') {
					throw new NodeOperationError(
						executeFunctions.getNode(),
						'Data is required',
						{ itemIndex: i }
					);
				}
				
				// Process data based on type
				let data: any;
				if (typeof dataInput === 'string') {
					if (DEBUG) console.log(`DEBUG - Create Record: Processing data parameter as string`);
					data = validateJSON(executeFunctions, dataInput, i);
				} else if (typeof dataInput === 'object' && dataInput !== null) { // Check if it's a non-null object
					if (DEBUG) console.log(`DEBUG - Create Record: Processing data parameter as object`);
					data = dataInput;
				} else {
					throw new NodeOperationError(
						executeFunctions.getNode(),
						`Data must be a JSON string or a JSON object, received type: ${typeof dataInput}`,
						{ itemIndex: i }
					);
				}
				
				if (DEBUG) console.log(`DEBUG - Create Record: Executing create operation for table ${table}`);
				
				// Execute the create operation
				const result = await client.create(table, data);
				
				if (DEBUG) console.log(`DEBUG - Create Record: Operation successful, formatting result`);
				
				// Format the result
				const formattedResult = formatSingleResult(result);
				returnData.push({
					...formattedResult,
					pairedItem: { item: i },
				});
				
			} catch (error) {
				if (DEBUG) console.log(`DEBUG - Create Record: Error for item ${i}: ${error.message}`);
				
				// Handle errors based on continueOnFail setting
				if (executeFunctions.continueOnFail()) {
					if (DEBUG) console.log(`DEBUG - Create Record: ContinueOnFail enabled, adding error to results`);
					
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				
				// If continueOnFail is not enabled, re-throw the error
				if (DEBUG) console.log(`DEBUG - Create Record: ContinueOnFail disabled, re-throwing error`);
				throw error;
			}
		}
		
		if (DEBUG) console.log(`DEBUG - Create Record: Operation complete, returning ${returnData.length} items`);
		return returnData;
	},
};