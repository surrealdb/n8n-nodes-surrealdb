import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const deleteOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const documentId = executeFunctions.getNodeParameter(
            "documentId",
            itemIndex,
        ) as string;

        if (!documentId || documentId.trim() === "") {
            throw new Error("Document ID is required for delete operation");
        }

        const result = await client.knowledge.delete(documentId.trim());
        pushResult(returnData, result, itemIndex);
        return returnData;
    },
};
