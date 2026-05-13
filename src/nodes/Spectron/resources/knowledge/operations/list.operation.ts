import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const listOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const filtersRaw = executeFunctions.getNodeParameter(
            "filters",
            itemIndex,
            "{}",
        ) as string;

        let filters: Record<string, unknown> = {};
        if (filtersRaw && filtersRaw.trim() !== "") {
            try {
                filters = JSON.parse(filtersRaw);
            } catch (e) {
                throw new Error(
                    `Invalid JSON in "Filters": ${(e as Error).message}`,
                );
            }
        }

        const result = await client.knowledge.list(filters);
        pushResult(returnData, result, itemIndex);
        return returnData;
    },
};
