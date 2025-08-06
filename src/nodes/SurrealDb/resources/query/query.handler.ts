import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import { executeQueryOperation } from "./operations/executeQuery.operation";
import { buildSelectQueryOperation } from "./operations/buildSelectQuery.operation";
import { createErrorResult } from "../../utilities";

/**
 * Handle all operations for the Query resource
 */
export async function handleQueryOperations(
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
                case "executeQuery":
                    returnData = [
                        ...returnData,
                        ...(await executeQueryOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "buildSelectQuery":
                    returnData = [
                        ...returnData,
                        ...(await buildSelectQueryOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                default:
                    throw new Error(
                        `The operation "${operation}" is not supported for the Query resource!`,
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
