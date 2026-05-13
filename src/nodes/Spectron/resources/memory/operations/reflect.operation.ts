import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const reflectOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const inputRaw = executeFunctions.getNodeParameter(
            "memoryInput",
            itemIndex,
            "{}",
        ) as string;

        let input: Record<string, unknown> = {};
        if (inputRaw && inputRaw.trim() !== "") {
            try {
                input = JSON.parse(inputRaw);
            } catch (e) {
                throw new Error(
                    `Invalid JSON in "Input": ${(e as Error).message}`,
                );
            }
        }

        const result = await client.memory.reflect(input);
        pushResult(returnData, result, itemIndex);
        return returnData;
    },
};
