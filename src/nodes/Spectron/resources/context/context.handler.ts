import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";

import { queryOperation } from "./operations/query.operation";
import { retrieveOperation } from "./operations/retrieve.operation";
import { pushError } from "../../GenericFunctions";

export async function handleContextOperations(
    operation: string,
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
    let returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            switch (operation) {
                case "query":
                    returnData = [
                        ...returnData,
                        ...(await queryOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "retrieve":
                    returnData = [
                        ...returnData,
                        ...(await retrieveOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                default:
                    throw new Error(
                        `The operation "${operation}" is not supported for the Context resource!`,
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
