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
	// Route to the appropriate operation handler
	if (operation === 'createIndex') {
		return createIndexOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'dropIndex') {
		return dropIndexOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'listIndexes') {
		return listIndexesOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'describeIndex') {
		return describeIndexOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'rebuildIndex') {
		return rebuildIndexOperation.execute(client, items, executeFunctions, 0);
	}

	// If the operation is not recognized, return an empty array
	return [];
}