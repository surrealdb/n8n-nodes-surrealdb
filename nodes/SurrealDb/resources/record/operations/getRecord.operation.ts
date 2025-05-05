import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, cleanTableName } from '../../../GenericFunctions';
import { formatSingleResult, createRecordId, parseAndValidateRecordId, debugLog } from '../../../utilities';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Get Record operation handler for Record resource
 */
export const getRecordOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		try {
			if (DEBUG) debugLog('getRecord', 'Starting operation', itemIndex);
			// Get parameters for the specific item
			let table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			const idInput = executeFunctions.getNodeParameter('id', itemIndex) as string;

			// Clean and standardize the table name
			table = cleanTableName(table);

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
			
			// Create the record ID
			const recordId = createRecordId(table, validatedId);
			
			// Execute the select operation
			const result = await client.select(recordId);
			
			// Check if the record was found (result is not null/undefined/empty object)
			// SurrealDB's client.select returns the record object if found, or null/undefined if not found.
			// An empty object check is included for robustness, though less likely.
			if (result !== null && result !== undefined && (typeof result !== 'object' || Object.keys(result).length > 0)) {
				// Format the result only if found
				const formattedResult = formatSingleResult(result);
				return [{
					...formattedResult,
					pairedItem: { item: itemIndex },
				}];
			}
			
			// If not found, return an empty array (standard n8n pattern for "not found")
			return [];
			
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