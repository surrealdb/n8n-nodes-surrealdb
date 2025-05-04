import type { Surreal } from 'surrealdb';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { createIndexOperation } from './operations/createIndex.operation';
import { dropIndexOperation } from './operations/dropIndex.operation';
import { listIndexesOperation } from './operations/listIndexes.operation';
import { describeIndexOperation } from './operations/describeIndex.operation';
import { rebuildIndexOperation } from './operations/rebuildIndex.operation';

/**
 * Router for index operations
 */
export async function handleIndexOperations(
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
				case 'createIndex':
					returnData = [...returnData, ...(await createIndexOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'dropIndex':
					returnData = [...returnData, ...(await dropIndexOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'listIndexes':
					returnData = [...returnData, ...(await listIndexesOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'describeIndex':
					returnData = [...returnData, ...(await describeIndexOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'rebuildIndex':
					returnData = [...returnData, ...(await rebuildIndexOperation.execute(client, items, executeFunctions, i))];
					break;
				default:
					// If the operation is not recognized, just continue
					break;
			}
		} catch (error) {
			// Don't handle errors here, let the operations handle them
			// This is to avoid double-handling of errors
			throw error;
		}
	}
	
	return returnData;
}