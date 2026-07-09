import type { INodeProperties } from "n8n-workflow";
import { numberField, stringField } from "../../fieldHelpers";

const RESOURCE = "keyword";

export const keywordOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: [RESOURCE] } },
        options: [
            {
                name: "List",
                value: "list",
                description: "List keywords with optional filters and pagination",
                action: "List keywords",
            },
            {
                name: "Search",
                value: "search",
                description: "Vector search over keyword embeddings",
                action: "Search keywords",
            },
            {
                name: "Get",
                value: "get",
                description: "Get one keyword by its normalised form",
                action: "Get a keyword",
            },
            {
                name: "For Document",
                value: "forDocument",
                description: "List keywords linked to a document",
                action: "Get keywords for a document",
            },
        ],
        default: "list",
    },
];

export const keywordFields: INodeProperties[] = [
    stringField("q", "Query Filter", { resource: RESOURCE, operations: ["list"] }),
    numberField(
        "minDocumentCount",
        "Min Document Count",
        { resource: RESOURCE, operations: ["list"] },
        undefined,
    ),
    stringField("sort", "Sort", { resource: RESOURCE, operations: ["list"] }),
    numberField("page", "Page", { resource: RESOURCE, operations: ["list"] }, undefined),
    numberField(
        "pageSize",
        "Page Size",
        { resource: RESOURCE, operations: ["list"] },
        undefined,
    ),

    stringField(
        "query",
        "Query",
        { resource: RESOURCE, operations: ["search"] },
        { required: true },
    ),
    numberField("k", "Max Results (k)", { resource: RESOURCE, operations: ["search"] }, 10),
    numberField(
        "threshold",
        "Threshold",
        { resource: RESOURCE, operations: ["search"] },
        undefined,
    ),

    stringField(
        "normalised",
        "Normalised Keyword",
        { resource: RESOURCE, operations: ["get"] },
        { required: true },
    ),
    stringField(
        "documentId",
        "Document ID",
        { resource: RESOURCE, operations: ["forDocument"] },
        { required: true },
    ),
];
