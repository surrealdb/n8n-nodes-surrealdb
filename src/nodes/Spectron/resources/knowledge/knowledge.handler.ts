import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";

import { uploadOperation } from "./operations/upload.operation";
import { listOperation } from "./operations/list.operation";
import { deleteOperation } from "./operations/delete.operation";
import { pushError } from "../../GenericFunctions";

export async function handleKnowledgeOperations(
    operation: string,
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
    let returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            switch (operation) {
                case "upload":
                    returnData = [
                        ...returnData,
                        ...(await uploadOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "list":
                    returnData = [
                        ...returnData,
                        ...(await listOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "delete":
                    returnData = [
                        ...returnData,
                        ...(await deleteOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                default:
                    throw new Error(
                        `The operation "${operation}" is not supported for the Knowledge resource!`,
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
