import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateAndParseData, cleanTableName, buildCredentialsObject } from '../../../GenericFunctions';
import { createRecordId, debugLog, addErrorResult, addSuccessResult } from '../../../utilities';

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

		try {
			if (DEBUG) debugLog('createRecord', 'Starting operation', itemIndex);

			// Get parameters
			const tableInput = executeFunctions.getNodeParameter('table', itemIndex) as string;
			validateRequiredField(executeFunctions, tableInput, 'Table', itemIndex);
			const table = cleanTableName(tableInput);

			// Get and validate record data
			const dataInput = executeFunctions.getNodeParameter('data', itemIndex);
			const data = validateAndParseData(executeFunctions, dataInput, 'Data', itemIndex);

			// Check if specific ID is provided
			const providedId = executeFunctions.getNodeParameter('id', itemIndex, '') as string;
			let recordId;

			if (providedId && providedId.trim() !== '') {
				if (DEBUG) debugLog('createRecord', 'Using provided ID', itemIndex, providedId);
				// Create the record ID with the provided ID
				recordId = createRecordId(table, providedId.trim());
			} else {
				// No ID provided, use only the table for auto-generation of ID by SurrealDB
				if (DEBUG) debugLog('createRecord', 'No ID provided, using table name only for auto-ID generation', itemIndex);
				recordId = table;
			}

			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;

			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');

			// Build credentials object
			buildCredentialsObject(credentials, options);

			if (DEBUG) {
				debugLog('createRecord', 'Record ID', itemIndex, recordId);
				debugLog('createRecord', 'Data', itemIndex, JSON.stringify(data));
			}

			// Create the record
			const result = await client.create(recordId, data);

			if (DEBUG) {
				debugLog('createRecord', 'Raw creation result', itemIndex, JSON.stringify(result));
			}

			// Return the raw SurrealDB response directly without transformation
			// This respects SurrealDB's native data format and ensures future compatibility
			if (DEBUG) debugLog('createRecord', 'Returning raw result', itemIndex, JSON.stringify(result));

			// Handle null/undefined result
			if (result === null || result === undefined) {
				addSuccessResult(returnData, {} as IDataObject, itemIndex); // Empty object for null/undefined results
			} else {
				addSuccessResult(returnData, result as unknown as IDataObject, itemIndex);
			}

		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				if (DEBUG) debugLog('createRecord', 'Error with continueOnFail enabled', itemIndex, error.message);
				addErrorResult(returnData, error, itemIndex);
			} else {
				if (DEBUG) debugLog('createRecord', 'Error, stopping execution', itemIndex, error.message);
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error creating record: ${error.message}`,
					{ itemIndex }
				);
			}
		}

		if (DEBUG) debugLog('createRecord', `Completed, returning ${returnData.length} items`, itemIndex);
		return returnData;
	},
};