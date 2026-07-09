import type { INodeProperties } from "n8n-workflow";
import {
    additionalFieldsJson,
    labelsField,
    numberField,
    optionsField,
    scopesField,
    stringField,
} from "../../fieldHelpers";

const RESOURCE = "document";

export const documentOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: [RESOURCE] } },
        options: [
            {
                name: "Upload",
                value: "upload",
                description: "Upload a document from a binary property",
                action: "Upload a document",
            },
            {
                name: "Reprocess",
                value: "reprocess",
                description: "Reprocess an existing document with replacement bytes",
                action: "Reprocess a document",
            },
            {
                name: "Get",
                value: "get",
                description: "Get metadata for one document",
                action: "Get a document",
            },
            {
                name: "Get Raw",
                value: "raw",
                description: "Download the raw document bytes as binary",
                action: "Get raw document bytes",
            },
            {
                name: "Get Chunks",
                value: "chunks",
                description: "Get paginated text chunks for a document",
                action: "Get document chunks",
            },
            {
                name: "List",
                value: "list",
                description: "List documents with optional filters",
                action: "List documents",
            },
            {
                name: "Search",
                value: "query",
                description: "Hybrid / vector / BM25 / graph search over the corpus",
                action: "Search documents",
            },
            {
                name: "Recompute Links",
                value: "recomputeLinks",
                description: "Recompute derived document and keyword links",
                action: "Recompute links",
            },
            {
                name: "Delete",
                value: "delete",
                description: "Delete a document",
                action: "Delete a document",
            },
        ],
        default: "upload",
    },
];

export const documentFields: INodeProperties[] = [
    stringField(
        "documentId",
        "Document ID",
        {
            resource: RESOURCE,
            operations: ["reprocess", "get", "raw", "chunks", "delete"],
        },
        { required: true },
    ),
    {
        displayName: "Input Binary Field",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        required: true,
        description: "Name of the binary property holding the file to upload",
        displayOptions: {
            show: { resource: [RESOURCE], operation: ["upload", "reprocess"] },
        },
    },
    {
        displayName: "Output Binary Field",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        required: true,
        description: "Name of the binary property to write the downloaded bytes to",
        displayOptions: {
            show: { resource: [RESOURCE], operation: ["raw"] },
        },
    },
    stringField("title", "Title", {
        resource: RESOURCE,
        operations: ["upload", "reprocess"],
    }),
    stringField("source", "Source", {
        resource: RESOURCE,
        operations: ["upload", "reprocess"],
    }),
    scopesField({ resource: RESOURCE, operations: ["upload", "reprocess"] }),
    labelsField({ resource: RESOURCE, operations: ["upload", "reprocess"] }),

    // List filters
    optionsField(
        "status",
        "Status",
        { resource: RESOURCE, operations: ["list"] },
        [
            { name: "(Any)", value: "" },
            { name: "Queued", value: "queued" },
            { name: "Extracting", value: "extracting" },
            { name: "Chunking", value: "chunking" },
            { name: "Embedding", value: "embedding" },
            { name: "Keywording", value: "keywording" },
            { name: "Ready", value: "ready" },
            { name: "Failed", value: "failed" },
        ],
        "",
    ),
    stringField("mimeType", "MIME Type", {
        resource: RESOURCE,
        operations: ["list"],
    }),
    numberField(
        "page",
        "Page",
        { resource: RESOURCE, operations: ["list", "chunks"] },
        undefined,
    ),
    numberField(
        "pageSize",
        "Page Size",
        { resource: RESOURCE, operations: ["list", "chunks"] },
        undefined,
    ),

    // Search
    stringField(
        "query",
        "Query",
        { resource: RESOURCE, operations: ["query"] },
        { required: true },
    ),
    numberField("k", "Max Results (k)", { resource: RESOURCE, operations: ["query"] }, 10),
    optionsField(
        "mode",
        "Mode",
        { resource: RESOURCE, operations: ["query"] },
        [
            { name: "Hybrid", value: "hybrid" },
            { name: "Vector", value: "vector" },
            { name: "BM25", value: "bm25" },
            { name: "Hybrid Graph", value: "hybrid_graph" },
        ],
        "hybrid",
    ),
    additionalFieldsJson({ resource: RESOURCE, operations: ["query"] }),
];
