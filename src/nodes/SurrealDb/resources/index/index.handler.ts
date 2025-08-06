import type { Surreal } from "surrealdb";
import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { createIndexOperation } from "./operations/createIndex.operation";
import { dropIndexOperation } from "./operations/dropIndex.operation";
import { listIndexesOperation } from "./operations/listIndexes.operation";
import { describeIndexOperation } from "./operations/describeIndex.operation";
import { rebuildIndexOperation } from "./operations/rebuildIndex.operation";
//import { createErrorResult } from '../../utilities';

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
                case "createIndex":
                    returnData = [
                        ...returnData,
                        ...(await createIndexOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "dropIndex":
                    returnData = [
                        ...returnData,
                        ...(await dropIndexOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "listIndexes":
                    returnData = [
                        ...returnData,
                        ...(await listIndexesOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "describeIndex":
                    returnData = [
                        ...returnData,
                        ...(await describeIndexOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "rebuildIndex":
                    returnData = [
                        ...returnData,
                        ...(await rebuildIndexOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                default:
                    // If the operation is not recognized, just continue
                    break;
            }
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
