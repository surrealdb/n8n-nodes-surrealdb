import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateJSON } from '../../../GenericFunctions';
import { formatSingleResult, debugLog } from '../../../utilities';

// Set to false to disable debug logging
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
		if (DEBUG) debugLog('createRecord', 'Starting operation');

		try {
			if (DEBUG) debugLog('createRecord', 'Processing item', itemIndex);

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
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'Data is required',
					{ itemIndex }
				);
			}

			// Process data based on type
			let data: any;
			if (typeof dataInput === 'string') {
				if (DEBUG) debugLog('createRecord', 'Processing data parameter as string', itemIndex);
				data = validateJSON(executeFunctions, dataInput, itemIndex);
			} else if (typeof dataInput === 'object' && dataInput !== null) { // Check if it's a non-null object
				if (DEBUG) debugLog('createRecord', 'Processing data parameter as object', itemIndex);
				data = dataInput;
			} else {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Data must be a JSON string or a JSON object, received type: ${typeof dataInput}`,
					{ itemIndex }
				);
			}

			if (DEBUG) debugLog('createRecord', `Executing create operation for table ${table}`, itemIndex);

			// Execute the create operation
			const result = await client.create(table, data);

			if (DEBUG) debugLog('createRecord', 'Operation successful, formatting result', itemIndex);

			// Format the result
			const formattedResult = formatSingleResult(result);
			return [{
				...formattedResult,
				pairedItem: { item: itemIndex },
			}];

		} catch (error) {
			// Handle errors based on continueOnFail setting
			if (executeFunctions.continueOnFail()) {
				return [{
					json: { error: error.message },
					pairedItem: { item: itemIndex },
				}];
			}

			// If continueOnFail is not enabled, re-throw the error
			throw error;
		}
	},
};