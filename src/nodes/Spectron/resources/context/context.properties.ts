import type { INodeProperties } from "n8n-workflow";

export const contextOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["context"],
            },
        },
        options: [
            {
                name: "Query",
                value: "query",
                description: "Query Spectron context for relevant material",
                action: "Query Spectron context",
            },
            {
                name: "Retrieve",
                value: "retrieve",
                description: "Retrieve context items",
                action: "Retrieve context items",
            },
        ],
        default: "query",
    },
];

export const contextFields: INodeProperties[] = [
    {
        displayName: "Query",
        name: "query",
        type: "string",
        default: "",
        required: true,
        typeOptions: {
            rows: 3,
        },
        description: "The query string to search context for",
        displayOptions: {
            show: {
                resource: ["context"],
                operation: ["query"],
            },
        },
    },
    {
        displayName: "Additional Fields",
        name: "additionalFields",
        type: "json",
        default: "{}",
        description:
            "Optional extra fields forwarded to the query call (JSON object)",
        displayOptions: {
            show: {
                resource: ["context"],
                operation: ["query"],
            },
        },
    },
    {
        displayName: "Retrieve Input",
        name: "retrieveInput",
        type: "json",
        default: "{}",
        description:
            "Optional input forwarded to context.retrieve (JSON object)",
        displayOptions: {
            show: {
                resource: ["context"],
                operation: ["retrieve"],
            },
        },
    },
];
