import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const getSessionOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const sessionId = executeFunctions.getNodeParameter(
            "sessionId",
            itemIndex,
        ) as string;

        if (!sessionId || sessionId.trim() === "") {
            throw new Error("Session ID is required");
        }

        const session = await client.sessions.get(sessionId.trim());
        pushResult(returnData, session, itemIndex);
        return returnData;
    },
};
