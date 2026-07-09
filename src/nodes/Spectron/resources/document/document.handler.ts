import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { DocumentUploadOptions, Spectron } from "@surrealdb/spectron";

type DocumentQueryOptions = Parameters<Spectron["documents"]["query"]>[0];
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

async function buildUploadOptions(
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
): Promise<DocumentUploadOptions> {
    const binaryPropertyName = getItemParam<string>(
        executeFunctions,
        "binaryPropertyName",
        itemIndex,
        "data",
    );
    const binary = await executeFunctions.helpers.getBinaryDataBuffer(
        itemIndex,
        binaryPropertyName,
    );
    const binaryMeta = executeFunctions.helpers.assertBinaryData(
        itemIndex,
        binaryPropertyName,
    );
    const title = getItemParam<string>(executeFunctions, "title", itemIndex, "").trim();
    const source = getItemParam<string>(executeFunctions, "source", itemIndex, "").trim();

    const options: DocumentUploadOptions = {
        file: new Uint8Array(binary),
        filename: binaryMeta.fileName ?? "upload",
        contentType: binaryMeta.mimeType,
        scopes: parseScope(
            getItemParam<string>(executeFunctions, "scopes", itemIndex, ""),
        ),
        labels: parseStringList(
            getItemParam<string>(executeFunctions, "labels", itemIndex, ""),
        ),
    };
    if (title) options.title = title;
    if (source) options.source = source;
    return options;
}

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
    async upload({ client, executeFunctions, itemIndex, returnData }) {
        const options = await buildUploadOptions(executeFunctions, itemIndex);
        const result = await client.documents.upload(options);
        pushResult(returnData, result, itemIndex);
    },

    async reprocess({ client, executeFunctions, itemIndex, returnData }) {
        const documentId = requireString(
            executeFunctions,
            "documentId",
            itemIndex,
            "Document ID",
        );
        const options = await buildUploadOptions(executeFunctions, itemIndex);
        const result = await client.documents.reprocess(documentId, options);
        pushResult(returnData, result, itemIndex);
    },

    async get({ client, executeFunctions, itemIndex, returnData }) {
        const documentId = requireString(
            executeFunctions,
            "documentId",
            itemIndex,
            "Document ID",
        );
        const result = await client.documents.get(documentId);
        pushResult(returnData, result, itemIndex);
    },

    async raw({ client, executeFunctions, itemIndex, returnData }) {
        const documentId = requireString(
            executeFunctions,
            "documentId",
            itemIndex,
            "Document ID",
        );
        const binaryPropertyName = getItemParam<string>(
            executeFunctions,
            "binaryPropertyName",
            itemIndex,
            "data",
        );
        const bytes = await client.documents.raw(documentId);
        const buffer = Buffer.from(new Uint8Array(bytes));
        const binaryData = await executeFunctions.helpers.prepareBinaryData(
            buffer,
            documentId,
        );
        returnData.push({
            json: { documentId },
            binary: { [binaryPropertyName]: binaryData },
            pairedItem: { item: itemIndex },
        });
    },

    async chunks({ client, executeFunctions, itemIndex, returnData }) {
        const documentId = requireString(
            executeFunctions,
            "documentId",
            itemIndex,
            "Document ID",
        );
        const result = await client.documents.chunks(documentId, {
            page: optionalNumber(executeFunctions, "page", itemIndex),
            pageSize: optionalNumber(executeFunctions, "pageSize", itemIndex),
        });
        pushResult(returnData, result, itemIndex);
    },

    async list({ client, executeFunctions, itemIndex, returnData }) {
        const status = getItemParam<string>(executeFunctions, "status", itemIndex, "").trim();
        const mimeType = getItemParam<string>(
            executeFunctions,
            "mimeType",
            itemIndex,
            "",
        ).trim();
        const result = await client.documents.list({
            status: status || undefined,
            mimeType: mimeType || undefined,
            page: optionalNumber(executeFunctions, "page", itemIndex),
            pageSize: optionalNumber(executeFunctions, "pageSize", itemIndex),
        });
        pushResult(returnData, result, itemIndex);
    },

    async query({ client, executeFunctions, itemIndex, returnData }) {
        const query = requireString(executeFunctions, "query", itemIndex, "Query");
        const options: Record<string, unknown> = {
            query,
            k: getItemParam<number>(executeFunctions, "k", itemIndex, 10),
            mode: getItemParam<string>(executeFunctions, "mode", itemIndex, "hybrid"),
            ...parseJsonObject(
                getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
                "Additional Fields (JSON)",
            ),
        };
        const result = await client.documents.query(
            options as DocumentQueryOptions,
        );
        pushResult(returnData, result, itemIndex);
    },

    async recomputeLinks({ client, itemIndex, returnData }) {
        const result = await client.documents.recomputeLinks();
        pushResult(returnData, result, itemIndex);
    },

    async delete({ client, executeFunctions, itemIndex, returnData }) {
        const documentId = requireString(
            executeFunctions,
            "documentId",
            itemIndex,
            "Document ID",
        );
        await client.documents.delete(documentId);
        pushResult(returnData, { success: true, documentId }, itemIndex);
    },
};

export async function handleDocumentOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Document", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
