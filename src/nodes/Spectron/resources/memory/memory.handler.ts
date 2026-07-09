import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type {
    ChatOptions,
    RecallOptions,
    RememberManyOptions,
    RememberOptions,
    Spectron,
} from "@surrealdb/spectron";
import type {
    ISpectronCredentials,
    SpectronOperation,
} from "../../types/spectron.types";
import {
    getItemParam,
    parseJsonObject,
    parseScope,
    parseStringList,
    pushResult,
    requireString,
    runOperations,
} from "../../GenericFunctions";

const operations: Record<string, SpectronOperation> = {
    async remember({ client, executeFunctions, itemIndex, returnData }) {
        const text = getItemParam<string>(executeFunctions, "text", itemIndex, "");
        const role = getItemParam<string>(executeFunctions, "role", itemIndex, "user");
        const infer = getItemParam<string>(executeFunctions, "infer", itemIndex, "full");
        const memoryCategory = getItemParam<string>(
            executeFunctions,
            "memoryCategory",
            itemIndex,
            "",
        );
        const opts: Record<string, unknown> = {
            role,
            infer,
            scopes: parseScope(
                getItemParam<string>(executeFunctions, "scopes", itemIndex, ""),
            ),
            sessionId:
                getItemParam<string>(executeFunctions, "sessionId", itemIndex, "").trim() ||
                undefined,
            labels: parseStringList(
                getItemParam<string>(executeFunctions, "labels", itemIndex, ""),
            ),
            ...parseJsonObject(
                getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
                "Additional Fields (JSON)",
            ),
        };
        if (memoryCategory) opts.memoryCategory = memoryCategory;
        const result = await client.remember(text || undefined, opts as RememberOptions);
        pushResult(returnData, result, itemIndex);
    },

    async rememberMany({ client, executeFunctions, itemIndex, returnData }) {
        const messagesRaw = getItemParam<string>(
            executeFunctions,
            "messages",
            itemIndex,
            "[]",
        );
        let messages: unknown;
        try {
            messages = JSON.parse(messagesRaw);
        } catch (e) {
            throw new Error(`Invalid JSON in "Messages": ${(e as Error).message}`);
        }
        if (!Array.isArray(messages)) {
            throw new Error('"Messages" must be a JSON array of { role, content }');
        }
        const extract = getItemParam<string>(executeFunctions, "extract", itemIndex, "");
        const opts: Record<string, unknown> = {
            infer: getItemParam<string>(executeFunctions, "infer", itemIndex, "full"),
            scopes: parseScope(
                getItemParam<string>(executeFunctions, "scopes", itemIndex, ""),
            ),
            sessionId:
                getItemParam<string>(executeFunctions, "sessionId", itemIndex, "").trim() ||
                undefined,
            labels: parseStringList(
                getItemParam<string>(executeFunctions, "labels", itemIndex, ""),
            ),
            ...parseJsonObject(
                getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
                "Additional Fields (JSON)",
            ),
        };
        if (extract) opts.extract = extract;
        const result = await client.rememberMany(
            messages as Parameters<Spectron["rememberMany"]>[0],
            opts as RememberManyOptions,
        );
        pushResult(returnData, result, itemIndex);
    },

    async recall({ client, executeFunctions, itemIndex, returnData }) {
        const query = requireString(executeFunctions, "query", itemIndex, "Query");
        const opts: Record<string, unknown> = {
            k: getItemParam<number>(executeFunctions, "k", itemIndex, 10),
            mode: getItemParam<string>(executeFunctions, "mode", itemIndex, "hybrid"),
            scopeView: getItemParam<string>(
                executeFunctions,
                "scopeView",
                itemIndex,
                "strict",
            ),
            lens: parseScope(getItemParam<string>(executeFunctions, "lens", itemIndex, "")),
            sessionId:
                getItemParam<string>(executeFunctions, "sessionId", itemIndex, "").trim() ||
                undefined,
            labels: parseStringList(
                getItemParam<string>(executeFunctions, "labels", itemIndex, ""),
            ),
            ...parseJsonObject(
                getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
                "Additional Fields (JSON)",
            ),
        };
        const result = await client.recall(query, opts as RecallOptions);
        pushResult(returnData, result, itemIndex);
    },

    async context({ client, executeFunctions, itemIndex, returnData }) {
        const query = requireString(executeFunctions, "query", itemIndex, "Query");
        const opts: Record<string, unknown> = {
            k: getItemParam<number>(executeFunctions, "k", itemIndex, 10),
            scopeView: getItemParam<string>(
                executeFunctions,
                "scopeView",
                itemIndex,
                "strict",
            ),
            lens: parseScope(getItemParam<string>(executeFunctions, "lens", itemIndex, "")),
            labels: parseStringList(
                getItemParam<string>(executeFunctions, "labels", itemIndex, ""),
            ),
            ...parseJsonObject(
                getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
                "Additional Fields (JSON)",
            ),
        };
        const result = await client.context(query, opts as Parameters<Spectron["context"]>[1]);
        pushResult(returnData, result, itemIndex);
    },

    async reflect({ client, executeFunctions, itemIndex, returnData }) {
        const query = requireString(executeFunctions, "query", itemIndex, "Query");
        const persist = getItemParam<boolean>(executeFunctions, "persist", itemIndex, false);
        const result = await client.reflect(query, { persist });
        pushResult(returnData, result, itemIndex);
    },

    async forget({ client, executeFunctions, itemIndex, returnData }) {
        const query = requireString(executeFunctions, "query", itemIndex, "Query");
        const purge = getItemParam<boolean>(executeFunctions, "purge", itemIndex, false);
        const result = await client.forget(query, { purge });
        pushResult(returnData, result, itemIndex);
    },

    async chat({ client, executeFunctions, itemIndex, returnData }) {
        const message = requireString(executeFunctions, "message", itemIndex, "Message");
        const model = getItemParam<string>(executeFunctions, "model", itemIndex, "").trim();
        const opts: Record<string, unknown> = {
            scopes: parseScope(
                getItemParam<string>(executeFunctions, "scopes", itemIndex, ""),
            ),
            sessionId:
                getItemParam<string>(executeFunctions, "sessionId", itemIndex, "").trim() ||
                undefined,
            bypassCache: getItemParam<boolean>(
                executeFunctions,
                "bypassCache",
                itemIndex,
                false,
            ),
            labels: parseStringList(
                getItemParam<string>(executeFunctions, "labels", itemIndex, ""),
            ),
            ...parseJsonObject(
                getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
                "Additional Fields (JSON)",
            ),
        };
        if (model) opts.model = model;
        const result = await client.chat(message, opts as ChatOptions);
        pushResult(returnData, result, itemIndex);
    },
};

export async function handleMemoryOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Memory", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
