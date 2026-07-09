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
    async list({ client, itemIndex, returnData }) {
        const result = await client.scopes.list();
        pushResult(returnData, result, itemIndex);
    },

    async register({ client, executeFunctions, itemIndex, returnData }) {
        const path = requireString(executeFunctions, "path", itemIndex, "Path");
        const displayName = getItemParam<string>(
            executeFunctions,
            "displayName",
            itemIndex,
            "",
        ).trim();
        const description = getItemParam<string>(
            executeFunctions,
            "description",
            itemIndex,
            "",
        ).trim();
        const result = await client.scopes.register({
            path,
            displayName: displayName || undefined,
            description: description || undefined,
        });
        pushResult(returnData, result, itemIndex);
    },

    async delete({ client, executeFunctions, itemIndex, returnData }) {
        const path = requireString(executeFunctions, "path", itemIndex, "Path");
        await client.scopes.delete(path);
        pushResult(returnData, { success: true, path }, itemIndex);
    },

    async forget({ client, executeFunctions, itemIndex, returnData }) {
        const path = getItemParam<string>(executeFunctions, "path", itemIndex, "").trim();
        const result = await client.scopes.forget({ path: path || undefined });
        pushResult(returnData, result, itemIndex);
    },
};

export async function handleScopeOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Scope", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
