import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron, Verb } from "@surrealdb/spectron";
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

function getVerbs(
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
): (Verb | string)[] {
    const verbs = getItemParam<string[]>(executeFunctions, "verbs", itemIndex, []);
    if (!Array.isArray(verbs) || verbs.length === 0) {
        throw new Error("At least one verb is required");
    }
    return verbs;
}

const operations: Record<string, SpectronOperation> = {
    async list({ client, itemIndex, returnData }) {
        const result = await client.principals.list();
        pushResult(returnData, result, itemIndex);
    },

    async get({ client, executeFunctions, itemIndex, returnData }) {
        const principalId = requireString(
            executeFunctions,
            "principalId",
            itemIndex,
            "Principal ID",
        );
        const result = await client.principals.get(principalId);
        pushResult(returnData, result, itemIndex);
    },

    async effective({ client, executeFunctions, itemIndex, returnData }) {
        const principalId = requireString(
            executeFunctions,
            "principalId",
            itemIndex,
            "Principal ID",
        );
        const path = requireString(executeFunctions, "path", itemIndex, "Scope Path");
        const asOf = getItemParam<string>(executeFunctions, "asOf", itemIndex, "").trim();
        const result = await client.principals.effective(principalId, {
            path,
            asOf: asOf || undefined,
        });
        pushResult(returnData, result, itemIndex);
    },

    async grant({ client, executeFunctions, itemIndex, returnData }) {
        const principalId = requireString(
            executeFunctions,
            "principalId",
            itemIndex,
            "Principal ID",
        );
        const path = requireString(executeFunctions, "path", itemIndex, "Scope Path");
        const verbs = getVerbs(executeFunctions, itemIndex);
        const result = await client.principals.grant(principalId, { path, verbs });
        pushResult(returnData, result, itemIndex);
    },

    async revoke({ client, executeFunctions, itemIndex, returnData }) {
        const principalId = requireString(
            executeFunctions,
            "principalId",
            itemIndex,
            "Principal ID",
        );
        const path = requireString(executeFunctions, "path", itemIndex, "Scope Path");
        const verbs = getVerbs(executeFunctions, itemIndex);
        const result = await client.principals.revoke(principalId, { path, verbs });
        pushResult(returnData, result, itemIndex);
    },
};

export async function handlePrincipalOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Principal", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
