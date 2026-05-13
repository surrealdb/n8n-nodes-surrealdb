import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";

import { profileOperation } from "./operations/profile.operation";
import { reflectOperation } from "./operations/reflect.operation";
import { pushError } from "../../GenericFunctions";

export async function handleMemoryOperations(
    operation: string,
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
    let returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            switch (operation) {
                case "profile":
                    returnData = [
                        ...returnData,
                        ...(await profileOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                case "reflect":
                    returnData = [
                        ...returnData,
                        ...(await reflectOperation.execute(
                            client,
                            items,
                            executeFunctions,
                            i,
                        )),
                    ];
                    break;
                default:
                    throw new Error(
                        `The operation "${operation}" is not supported for the Memory resource!`,
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
