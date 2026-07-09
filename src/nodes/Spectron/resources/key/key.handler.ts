import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type {
    ISpectronCredentials,
    SpectronOperation,
} from "../../types/spectron.types";
import {
    getItemParam,
    parseJsonObject,
    pushResult,
    requireString,
    runOperations,
} from "../../GenericFunctions";

function optionalNumber(
    executeFunctions: IExecuteFunctions,
    name: string,
    itemIndex: number,
): number | undefined {
    const value = getItemParam<number | undefined>(
        executeFunctions,
        name,
        itemIndex,
        undefined,
    );
    return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
}

const operations: Record<string, SpectronOperation> = {
    async create({ client, executeFunctions, itemIndex, returnData }) {
        const name = getItemParam<string>(executeFunctions, "name", itemIndex, "").trim();
        const grants = parseJsonObject(
            getItemParam<string>(executeFunctions, "grants", itemIndex, "{}"),
            "Grants (JSON)",
        );
        const result = await client.keys.create({
            name: name || undefined,
            grants: Object.keys(grants).length > 0 ? grants : undefined,
            ttlSeconds: optionalNumber(executeFunctions, "ttlSeconds", itemIndex),
        });
        pushResult(returnData, result, itemIndex);
    },

    async list({ client, itemIndex, returnData }) {
        const result = await client.keys.list();
        pushResult(returnData, result, itemIndex);
    },

    async rotate({ client, executeFunctions, itemIndex, returnData }) {
        const keyName = requireString(executeFunctions, "keyName", itemIndex, "Key Name");
        const result = await client.keys.rotate(keyName, {
            ttlSeconds: optionalNumber(executeFunctions, "ttlSeconds", itemIndex),
        });
        pushResult(returnData, result, itemIndex);
    },

    async delete({ client, executeFunctions, itemIndex, returnData }) {
        const keyName = requireString(executeFunctions, "keyName", itemIndex, "Key Name");
        await client.keys.delete(keyName);
        pushResult(returnData, { success: true, keyName }, itemIndex);
    },
};

export async function handleKeyOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Key", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
