import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type {
    ISpectronCredentials,
    SpectronOperation,
} from "../../types/spectron.types";
import {
    getItemParam,
    getSession,
    parseScope,
    pushResult,
    requireString,
    runOperations,
} from "../../GenericFunctions";

const operations: Record<string, SpectronOperation> = {
    async create({ client, executeFunctions, itemIndex, returnData }) {
        const scopes = parseScope(
            getItemParam<string>(executeFunctions, "scopes", itemIndex, ""),
        );
        const metadataRaw = getItemParam<string>(
            executeFunctions,
            "metadata",
            itemIndex,
            "{}",
        );
        let metadata: unknown;
        if (metadataRaw && metadataRaw.trim() !== "" && metadataRaw.trim() !== "{}") {
            try {
                metadata = JSON.parse(metadataRaw);
            } catch (e) {
                throw new Error(`Invalid JSON in "Metadata": ${(e as Error).message}`);
            }
        }
        const session = await client.sessions.create({ scopes, metadata });
        pushResult(
            returnData,
            {
                id: session.id,
                createdAt: session.createdAt,
                scopes: session.scopes,
            },
            itemIndex,
        );
    },

    async turns({ credentials, executeFunctions, itemIndex, returnData }) {
        const sessionId = requireString(
            executeFunctions,
            "sessionId",
            itemIndex,
            "Session ID",
        );
        const result = await getSession(credentials, sessionId).turns();
        pushResult(returnData, result, itemIndex);
    },

    async context({ credentials, executeFunctions, itemIndex, returnData }) {
        const sessionId = requireString(
            executeFunctions,
            "sessionId",
            itemIndex,
            "Session ID",
        );
        const query = requireString(executeFunctions, "query", itemIndex, "Query");
        const result = await getSession(credentials, sessionId).context({ query });
        pushResult(returnData, result, itemIndex);
    },

    async close({ credentials, executeFunctions, itemIndex, returnData }) {
        const sessionId = requireString(
            executeFunctions,
            "sessionId",
            itemIndex,
            "Session ID",
        );
        await getSession(credentials, sessionId).close();
        pushResult(returnData, { success: true, sessionId }, itemIndex);
    },
};

export async function handleSessionOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Session", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
