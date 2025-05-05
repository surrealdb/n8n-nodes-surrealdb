import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateAndParseData } from '../../../GenericFunctions';
import { createRecordId, parseAndValidateRecordId, debugLog, addSuccessResult, addErrorResult } from '../../../utilities';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Merge Record operation handler for Record resource
 */
export const mergeRecordOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		try {
			if (DEBUG) debugLog('mergeRecord', 'Starting operation', itemIndex);
			// Get parameters
			let table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			const idInput = executeFunctions.getNodeParameter('id', itemIndex) as string;

			// Ensure table is a string
			table = String(table || '');
			
			// If table contains a colon, use only the part before the colon
			if (table.includes(':')) {
				table = table.split(':')[0];
			}

			// Ensure idInput is a string
			const idInputStr = String(idInput || '');
			
			// If no table is specified but idInput has a table prefix, use the extracted table
			if (!table && idInputStr.includes(':')) {
				table = idInputStr.split(':')[0];
			}

			// Only validate table as required if it couldn't be extracted from the Record ID
			if (!table) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'Either Table field must be provided or Record ID must include a table prefix (e.g., "table:id")',
					{ itemIndex }
				);
			}
			validateRequiredField(executeFunctions, idInput, 'Record ID', itemIndex);

			// Parse and validate the record ID string
			const validatedId = parseAndValidateRecordId(idInput, table, executeFunctions.getNode(), itemIndex);
			
			// Get and validate record data
			const dataInput = executeFunctions.getNodeParameter('data', itemIndex);
			const data = validateAndParseData(executeFunctions, dataInput, 'Data', itemIndex);
			
			// Create the record ID
			const recordId = createRecordId(table, validatedId);
			
			// Execute the merge operation
			const result = await client.merge(recordId, data);
			
			// Check if the operation was successful
			if (result === null || result === undefined) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Failed to merge record: ${recordId.toString()}`,
					{ itemIndex }
				);
			}
			
			// Initialize the return data array
			const returnData: INodeExecutionData[] = [];
			
			// Check if result is an empty object
			if (typeof result === 'object' && Object.keys(result).length === 0) {
				// After merge, fetch the complete record to return
				const updatedRecord = await client.select(recordId);
				
				if (updatedRecord === null || updatedRecord === undefined) {
					// This shouldn't happen if merge succeeded, but just in case
					addSuccessResult(returnData, { 
						success: true, 
						message: `Record ${recordId.toString()} was merged successfully but couldn't be retrieved.` 
					}, itemIndex);
				} else {
					// Return the updated record
					addSuccessResult(returnData, updatedRecord, itemIndex);
				}
			} else {
				// Add the result to return data
				addSuccessResult(returnData, result, itemIndex);
			}
			
			return returnData;
		} catch (error) {
			// Handle errors based on continueOnFail setting
			if (executeFunctions.continueOnFail()) {
				const returnData: INodeExecutionData[] = [];
				addErrorResult(returnData, error, itemIndex);
				return returnData;
			}
			
			// If continueOnFail is not enabled, re-throw the error
			throw error;
		}
	},
};