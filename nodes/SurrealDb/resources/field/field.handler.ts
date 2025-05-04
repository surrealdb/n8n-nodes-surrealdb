import type { Surreal } from 'surrealdb';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { createFieldOperation } from './operations/createField.operation';

/**
 * Router for field operations
 */
export async function handleFieldOperations(
	operation: string,
	client: Surreal,
	items: INodeExecutionData[],
	executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
	// Route to the appropriate operation handler
	if (operation === 'createField') {
		return createFieldOperation.execute(client, items, executeFunctions, 0);
	}

	// If the operation is not recognized, return an empty array
	return [];
}