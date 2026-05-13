import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const retrieveOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const retrieveInputRaw = executeFunctions.getNodeParameter(
            "retrieveInput",
            itemIndex,
            "{}",
        ) as string;

        let retrieveInput: Record<string, unknown> = {};
        if (retrieveInputRaw && retrieveInputRaw.trim() !== "") {
            try {
                retrieveInput = JSON.parse(retrieveInputRaw);
            } catch (e) {
                throw new Error(
                    `Invalid JSON in "Retrieve Input": ${(e as Error).message}`,
                );
            }
        }

        const result = await client.context.retrieve(retrieveInput);
        pushResult(returnData, result, itemIndex);
        return returnData;
    },
};
