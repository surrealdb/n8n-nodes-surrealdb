import type { Surreal } from 'surrealdb';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getAllRecordsOperation } from './operations/getAllRecords.operation';
import { createManyOperation } from './operations/createMany.operation';
import { getManyOperation } from './operations/getMany.operation';
import { updateAllRecordsOperation } from './operations/updateAllRecords.operation';
import { deleteAllRecordsOperation } from './operations/deleteAllRecords.operation';
import { mergeAllRecordsOperation } from './operations/mergeAllRecords.operation';
import { createTableOperation } from './operations/createTable.operation';
import { deleteTableOperation } from './operations/deleteTable.operation';
import { listTablesOperation } from './operations/listTables.operation';
import { getTableOperation } from './operations/getTable.operation';

/**
 * Router for table operations
 */
export async function handleTableOperations(
	operation: string,
	client: Surreal,
	items: INodeExecutionData[],
	executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
	// Route to the appropriate operation handler
	if (operation === 'listTables') {
		return listTablesOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'getTable') {
		return getTableOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'createTable') {
		return createTableOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'deleteTable') {
		return deleteTableOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'getAllRecords') {
		return getAllRecordsOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'createMany') {
		return createManyOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'getMany') {
		return getManyOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'updateAllRecords') {
		return updateAllRecordsOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'deleteAllRecords') {
		return deleteAllRecordsOperation.execute(client, items, executeFunctions, 0);
	} else if (operation === 'mergeAllRecords') {
		return mergeAllRecordsOperation.execute(client, items, executeFunctions, 0);
	}

	// If the operation is not recognized, return an empty array
	return [];
}