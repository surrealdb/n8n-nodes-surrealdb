import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import { batchCreateOperation } from "./operations/batchCreate.operation";
import { batchUpdateOperation } from "./operations/batchUpdate.operation";
import { batchDeleteOperation } from "./operations/batchDelete.operation";
import { batchUpsertOperation } from "./operations/batchUpsert.operation";
import { createErrorResult } from "../../utilities";

/**
 * Handle all operations for the Batch resource
 */
export async function handleBatchOperations(
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
                case "batchCreate":
                    returnData = [
                        ...returnData,
                        ...(await batchCreateOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "batchUpdate":
                    returnData = [
                        ...returnData,
                        ...(await batchUpdateOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "batchDelete":
                    returnData = [
                        ...returnData,
                        ...(await batchDeleteOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "batchUpsert":
                    returnData = [
                        ...returnData,
                        ...(await batchUpsertOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                default:
                    throw new Error(
                        `The operation "${operation}" is not supported for the Batch resource!`,
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
