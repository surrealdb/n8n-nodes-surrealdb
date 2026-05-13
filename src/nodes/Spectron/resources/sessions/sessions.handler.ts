import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";

import { createSessionOperation } from "./operations/create.operation";
import { getSessionOperation } from "./operations/get.operation";
import { turnOperation } from "./operations/turn.operation";
import { pushError } from "../../GenericFunctions";

export async function handleSessionsOperations(
    operation: string,
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
    let returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            switch (operation) {
                case "create":
                    returnData = [
                        ...returnData,
                        ...(await createSessionOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "get":
                    returnData = [
                        ...returnData,
                        ...(await getSessionOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "turn":
                    returnData = [
                        ...returnData,
                        ...(await turnOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                default:
                    throw new Error(
                        `The operation "${operation}" is not supported for the Sessions resource!`,
                    );
            }
        } catch (error) {
            if (executeFunctions.continueOnFail()) {
                pushError(returnData, error as Error, i);
                continue;
            }
            throw error;
        }
    }

    return returnData;
}
