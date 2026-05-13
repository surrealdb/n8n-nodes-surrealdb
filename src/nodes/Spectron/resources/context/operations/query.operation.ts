import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const queryOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const query = executeFunctions.getNodeParameter(
            "query",
            itemIndex,
        ) as string;
        const additionalFieldsRaw = executeFunctions.getNodeParameter(
            "additionalFields",
            itemIndex,
            "{}",
        ) as string;

        if (!query || query.trim() === "") {
            throw new Error("Query is required");
        }

        let additionalFields: Record<string, unknown> = {};
        if (additionalFieldsRaw && additionalFieldsRaw.trim() !== "") {
            try {
                additionalFields = JSON.parse(additionalFieldsRaw);
            } catch (e) {
                throw new Error(
                    `Invalid JSON in "Additional Fields": ${(e as Error).message}`,
                );
            }
        }

        const result = await client.context.query({
            query,
            ...additionalFields,
        });

        pushResult(returnData, result, itemIndex);
        return returnData;
    },
};
