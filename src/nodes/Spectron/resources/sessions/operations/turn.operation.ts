import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const turnOperation: ISpectronOperationHandler = {
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
        const role = executeFunctions.getNodeParameter(
            "role",
            itemIndex,
            "user",
        ) as string;
        const content = executeFunctions.getNodeParameter(
            "content",
            itemIndex,
        ) as string;
        const additionalFieldsRaw = executeFunctions.getNodeParameter(
            "additionalFields",
            itemIndex,
            "{}",
        ) as string;

        if (!sessionId || sessionId.trim() === "") {
            throw new Error("Session ID is required");
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

        const session = await client.sessions.get(sessionId.trim());
        const result = await session.turn({
            role,
            content,
            ...additionalFields,
        });

        pushResult(returnData, result, itemIndex);
        return returnData;
    },
};
