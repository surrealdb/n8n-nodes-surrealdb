import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateAndParseData } from '../../../GenericFunctions';
import { createRecordId, parseAndValidateRecordId, debugLog, addSuccessResult, addErrorResult } from '../../../utilities';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Update Record operation handler for Record resource
 */
export const updateRecordOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		try {
			if (DEBUG) debugLog('updateRecord', 'Starting operation', itemIndex);
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
			
			const dataInput = executeFunctions.getNodeParameter('data', itemIndex); // Get potential object or string
			const data = validateAndParseData(executeFunctions, dataInput, 'Data', itemIndex);
			
			// Create the record ID
			const recordId = createRecordId(table, validatedId);
			
			// First check if record exists
			const existingRecord = await client.select(recordId);
			
			// If record doesn't exist, throw error
			if (existingRecord === null || existingRecord === undefined || 
				(typeof existingRecord === 'object' && Object.keys(existingRecord).length === 0)) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Cannot update record: Record not found: ${recordId.toString()}`,
					{ itemIndex }
				);
			}
			
			// Execute the update operation
			const result = await client.update(recordId, data);
			
			// Check if the operation was successful
			if (result === null || result === undefined) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Failed to update record: ${recordId.toString()}`,
					{ itemIndex }
				);
			}
			
			// Return the result using standardized success result handling
			const returnData: INodeExecutionData[] = [];
			addSuccessResult(returnData, result, itemIndex);
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