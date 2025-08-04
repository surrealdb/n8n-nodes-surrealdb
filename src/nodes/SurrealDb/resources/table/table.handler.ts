import type { Surreal } from "surrealdb";
import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { getAllRecordsOperation } from "./operations/getAllRecords.operation";
import { createManyOperation } from "./operations/createMany.operation";
import { getManyOperation } from "./operations/getMany.operation";
import { updateAllRecordsOperation } from "./operations/updateAllRecords.operation";
import { deleteAllRecordsOperation } from "./operations/deleteAllRecords.operation";
import { mergeAllRecordsOperation } from "./operations/mergeAllRecords.operation";
import { createTableOperation } from "./operations/createTable.operation";
import { deleteTableOperation } from "./operations/deleteTable.operation";
import { listTablesOperation } from "./operations/listTables.operation";
import { getTableOperation } from "./operations/getTable.operation";

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

  // Debug logging removed

  // Process each item
  for (let i = 0; i < items.length; i++) {
    try {
      let operationResult;

      // Route to the appropriate operation handler
      switch (operation) {
        case "listTables":
          operationResult = await listTablesOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "getTable":
          operationResult = await getTableOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "createTable":
          operationResult = await createTableOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "deleteTable":
          operationResult = await deleteTableOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "getAllRecords":
          operationResult = await getAllRecordsOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "createMany":
          operationResult = await createManyOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "getMany":
          operationResult = await getManyOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "updateAllRecords":
          operationResult = await updateAllRecordsOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "deleteAllRecords":
          operationResult = await deleteAllRecordsOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        case "mergeAllRecords":
          operationResult = await mergeAllRecordsOperation.execute(
            client,
            items,
            executeFunctions,
            i,
          );
          break;
        default:
          // If the operation is not recognized, just continue
          continue;
      }

      // Add the operation result to returnData
      returnData = [...returnData, ...operationResult];
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        // Structure the error object exactly as n8n expects
        returnData.push({
          json: {
            error: error.message || String(error),
          },
          pairedItem: { item: i },
        });
        continue;
      }

      throw error;
    }
  }

  return returnData;
}
