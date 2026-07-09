import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type {
    ISpectronCredentials,
    SpectronOperation,
} from "../../types/spectron.types";
import {
    getItemParam,
    pushResult,
    requireString,
    runOperations,
} from "../../GenericFunctions";

const operations: Record<string, SpectronOperation> = {
    async list({ client, executeFunctions, itemIndex, returnData }) {
        const limit = getItemParam<number | undefined>(
            executeFunctions,
            "limit",
            itemIndex,
            undefined,
        );
        const result = await client.traces.list({
            limit: typeof limit === "number" && !Number.isNaN(limit) ? limit : undefined,
        });
        pushResult(returnData, result, itemIndex);
    },

    async get({ client, executeFunctions, itemIndex, returnData }) {
        const traceId = requireString(executeFunctions, "traceId", itemIndex, "Trace ID");
        const result = await client.traces.get(traceId);
        pushResult(returnData, result, itemIndex);
    },

    async stats({ client, itemIndex, returnData }) {
        const result = await client.traces.stats();
        pushResult(returnData, result, itemIndex);
    },
};

export async function handleTraceOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Trace", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
