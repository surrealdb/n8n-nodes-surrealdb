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
	let returnData: INodeExecutionData[] = [];
	
	// Process each item
	for (let i = 0; i < items.length; i++) {
		try {
			// Route to the appropriate operation handler
			switch (operation) {
				case 'listTables':
					returnData = [...returnData, ...(await listTablesOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'getTable':
					returnData = [...returnData, ...(await getTableOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'createTable':
					returnData = [...returnData, ...(await createTableOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'deleteTable':
					returnData = [...returnData, ...(await deleteTableOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'getAllRecords':
					returnData = [...returnData, ...(await getAllRecordsOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'createMany':
					returnData = [...returnData, ...(await createManyOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'getMany':
					returnData = [...returnData, ...(await getManyOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'updateAllRecords':
					returnData = [...returnData, ...(await updateAllRecordsOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'deleteAllRecords':
					returnData = [...returnData, ...(await deleteAllRecordsOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'mergeAllRecords':
					returnData = [...returnData, ...(await mergeAllRecordsOperation.execute(client, items, executeFunctions, i))];
					break;
				default:
					// If the operation is not recognized, just continue
					break;
			}
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: i },
				});
				continue;
			}
			throw error;
		}
	}

	return returnData;
}