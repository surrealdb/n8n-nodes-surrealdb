import type { INodeProperties } from "n8n-workflow";

export const knowledgeOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["knowledge"],
            },
        },
        options: [
            {
                name: "Upload",
                value: "upload",
                description: "Upload a document to the knowledge store",
                action: "Upload a knowledge document",
            },
            {
                name: "List",
                value: "list",
                description: "List documents in the knowledge store",
                action: "List knowledge documents",
            },
            {
                name: "Delete",
                value: "delete",
                description: "Delete a document from the knowledge store",
                action: "Delete a knowledge document",
            },
        ],
        default: "upload",
    },
];

export const knowledgeFields: INodeProperties[] = [
    {
        displayName: "Binary Property",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        required: true,
        description:
            "Name of the binary property on the input item containing the file to upload",
        displayOptions: {
            show: {
                resource: ["knowledge"],
                operation: ["upload"],
            },
        },
    },
    {
        displayName: "Title",
        name: "title",
        type: "string",
        default: "",
        description: "Optional title for the uploaded document",
        displayOptions: {
            show: {
                resource: ["knowledge"],
                operation: ["upload"],
            },
        },
    },
    {
        displayName: "Additional Fields",
        name: "additionalFields",
        type: "json",
        default: "{}",
        description:
            "Optional extra fields forwarded to the Spectron upload call (JSON object)",
        displayOptions: {
            show: {
                resource: ["knowledge"],
                operation: ["upload"],
            },
        },
    },
    {
        displayName: "Filters",
        name: "filters",
        type: "json",
        default: "{}",
        description:
            "Optional filters forwarded to the list call (JSON object)",
        displayOptions: {
            show: {
                resource: ["knowledge"],
                operation: ["list"],
            },
        },
    },
    {
        displayName: "Document ID",
        name: "documentId",
        type: "string",
        default: "",
        required: true,
        description: "ID of the document to delete",
        displayOptions: {
            show: {
                resource: ["knowledge"],
                operation: ["delete"],
            },
        },
    },
];
