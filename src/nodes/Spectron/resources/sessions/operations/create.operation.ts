import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const createSessionOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const scopeRaw = executeFunctions.getNodeParameter(
            "scope",
            itemIndex,
            "{}",
        ) as string;

        let scope: Record<string, unknown> | undefined;
        if (scopeRaw && scopeRaw.trim() !== "" && scopeRaw.trim() !== "{}") {
            try {
                scope = JSON.parse(scopeRaw);
            } catch (e) {
                throw new Error(
                    `Invalid JSON in "Scope": ${(e as Error).message}`,
                );
            }
        }

        const session = await client.sessions.create(
            scope ? { scope } : undefined,
        );
        pushResult(returnData, session, itemIndex);
        return returnData;
    },
};
