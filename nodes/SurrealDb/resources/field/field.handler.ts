import type { Surreal } from 'surrealdb';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { createFieldOperation } from './operations/createField.operation';
import { listFieldsOperation } from './operations/listFields.operation';
import { deleteFieldOperation } from './operations/deleteField.operation';

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
	} else if (operation === 'listFields') {
		return listFieldsOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'deleteField') {
		return deleteFieldOperation.execute(client, items, executeFunctions, 0);
	}

	// If the operation is not recognized, return an empty array
	return [];
}