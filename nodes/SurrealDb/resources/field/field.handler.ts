import type { Surreal } from 'surrealdb';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { createFieldOperation } from './operations/createField.operation';
import { listFieldsOperation } from './operations/listFields.operation';
import { deleteFieldOperation } from './operations/deleteField.operation';
import { createErrorResult } from '../../utilities';

/**
 * Router for field operations
 */
export async function handleFieldOperations(
	operation: string,
	client: Surreal,
	items: INodeExecutionData[],
	executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
	let returnData: INodeExecutionData[] = [];
	
	const itemsLength = items.length;
	
	for (let i = 0; i < itemsLength; i++) {
		try {
			switch (operation) {
				case 'createField':
					returnData = [...returnData, ...(await createFieldOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'listFields':
					returnData = [...returnData, ...(await listFieldsOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'deleteField':
					returnData = [...returnData, ...(await deleteFieldOperation.execute(client, items, executeFunctions, i))];
					break;
				default:
					// If the operation is not recognized, just continue
					break;
			}
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				returnData.push(createErrorResult(error as Error, i));
				continue;
			}
			throw error;
		}
	}
	
	return returnData;
}