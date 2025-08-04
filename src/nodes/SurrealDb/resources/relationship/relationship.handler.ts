import type { Surreal } from "surrealdb";
import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { createRelationshipOperation } from "./operations/createRelationship.operation";
import { deleteRelationshipOperation } from "./operations/deleteRelationship.operation";
import { queryRelationshipsOperation } from "./operations/queryRelationships.operation";
import { createErrorResult } from "../../utilities";

/**
 * Router for relationship operations
 */
export async function handleRelationshipOperations(
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
        case "createRelationship":
          returnData = [
            ...returnData,
            ...(await createRelationshipOperation.execute(
              client,
              items,
              executeFunctions,
              i,
            )),
          ];
          break;
        case "deleteRelationship":
          returnData = [
            ...returnData,
            ...(await deleteRelationshipOperation.execute(
              client,
              items,
              executeFunctions,
              i,
            )),
          ];
          break;
        case "queryRelationships":
          returnData = [
            ...returnData,
            ...(await queryRelationshipsOperation.execute(
              client,
              items,
              executeFunctions,
              i,
            )),
          ];
          break;
        default:
          throw new Error(
            `The operation "${operation}" is not supported for the Relationship resource!`,
          );
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
