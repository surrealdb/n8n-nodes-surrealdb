import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateJSON } from '../../../GenericFunctions';
import { formatSingleResult } from '../../../utilities';

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
		// Get parameters
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
		
		// Execute the create operation
		const result = await client.create(table, data);
		
		// Format the result
		const formattedResult = formatSingleResult(result);
		return [{
			...formattedResult,
			pairedItem: { item: itemIndex },
		}];
	},
};