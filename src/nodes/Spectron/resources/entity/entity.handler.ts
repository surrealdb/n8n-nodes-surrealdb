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
        const type = getItemParam<string>(executeFunctions, "type", itemIndex, "").trim();
        const result = await client.entities.list({ type: type || undefined });
        pushResult(returnData, result, itemIndex);
    },

    async get({ client, executeFunctions, itemIndex, returnData }) {
        const entityType = requireString(
            executeFunctions,
            "entityType",
            itemIndex,
            "Entity Type",
        );
        const name = requireString(executeFunctions, "name", itemIndex, "Name");
        const result = await client.entities.get(entityType, name);
        pushResult(returnData, result, itemIndex);
    },

    async history({ client, executeFunctions, itemIndex, returnData }) {
        const entityType = requireString(
            executeFunctions,
            "entityType",
            itemIndex,
            "Entity Type",
        );
        const name = requireString(executeFunctions, "name", itemIndex, "Name");
        const key = requireString(executeFunctions, "key", itemIndex, "Attribute Key");
        const result = await client.entities.history(entityType, name, key);
        pushResult(returnData, result, itemIndex);
    },

    async delete({ client, executeFunctions, itemIndex, returnData }) {
        const entityType = requireString(
            executeFunctions,
            "entityType",
            itemIndex,
            "Entity Type",
        );
        const name = requireString(executeFunctions, "name", itemIndex, "Name");
        await client.entities.delete(entityType, name);
        pushResult(returnData, { success: true, entityType, name }, itemIndex);
    },
};

export async function handleEntityOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Entity", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
