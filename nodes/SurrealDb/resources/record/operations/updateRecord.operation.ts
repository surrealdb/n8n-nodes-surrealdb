import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateJSON } from '../../../GenericFunctions';
import { formatSingleResult, createRecordId, parseAndValidateRecordId } from '../../../utilities';

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
			throw new Error('Either Table field must be provided or Record ID must include a table prefix (e.g., "table:id")');
		}
		validateRequiredField(executeFunctions, idInput, 'Record ID', itemIndex);

		// Parse and validate the record ID string
		const validatedId = parseAndValidateRecordId(idInput, table, executeFunctions.getNode(), itemIndex);
		
		const dataInput = executeFunctions.getNodeParameter('data', itemIndex); // Get potential object or string
		// Validate required field based on raw input
		if (dataInput === undefined || dataInput === null || dataInput === '') {
			throw new Error('Data is required');
		}
		
		// Process data based on type
		let data: any;
		if (typeof dataInput === 'string') {
			data = validateJSON(executeFunctions, dataInput, itemIndex);
		} else if (typeof dataInput === 'object' && dataInput !== null) { // Check if it's a non-null object
			data = dataInput;
		} else {
			throw new Error(`Data must be a JSON string or a JSON object, received type: ${typeof dataInput}`);
		}
		
		// Create the record ID
		const recordId = createRecordId(table, validatedId);
		
		// Execute the update operation
		const result = await client.update(recordId, data);
		
		// Format the result
		const formattedResult = formatSingleResult(result);
		return [{
			...formattedResult,
			pairedItem: { item: itemIndex },
		}];
	},
};