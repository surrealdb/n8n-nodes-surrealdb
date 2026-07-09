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
    async list({ client, executeFunctions, itemIndex, returnData }) {
        const q = getItemParam<string>(executeFunctions, "q", itemIndex, "").trim();
        const sort = getItemParam<string>(executeFunctions, "sort", itemIndex, "").trim();
        const result = await client.documents.keywords.list({
            q: q || undefined,
            sort: sort || undefined,
            minDocumentCount: optionalNumber(
                executeFunctions,
                "minDocumentCount",
                itemIndex,
            ),
            page: optionalNumber(executeFunctions, "page", itemIndex),
            pageSize: optionalNumber(executeFunctions, "pageSize", itemIndex),
        });
        pushResult(returnData, result, itemIndex);
    },

    async search({ client, executeFunctions, itemIndex, returnData }) {
        const query = requireString(executeFunctions, "query", itemIndex, "Query");
        const result = await client.documents.keywords.search({
            query,
            k: optionalNumber(executeFunctions, "k", itemIndex),
            threshold: optionalNumber(executeFunctions, "threshold", itemIndex),
        });
        pushResult(returnData, result, itemIndex);
    },

    async get({ client, executeFunctions, itemIndex, returnData }) {
        const normalised = requireString(
            executeFunctions,
            "normalised",
            itemIndex,
            "Normalised Keyword",
        );
        const result = await client.documents.keywords.get(normalised);
        pushResult(returnData, result, itemIndex);
    },

    async forDocument({ client, executeFunctions, itemIndex, returnData }) {
        const documentId = requireString(
            executeFunctions,
            "documentId",
            itemIndex,
            "Document ID",
        );
        const result = await client.documents.keywords.forDocument(documentId);
        pushResult(returnData, result, itemIndex);
    },
};

export async function handleKeywordOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Keyword", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
