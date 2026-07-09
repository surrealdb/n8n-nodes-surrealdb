import type { INodeProperties } from "n8n-workflow";
import { scopesField, stringField, textField } from "../../fieldHelpers";

const RESOURCE = "session";

export const sessionOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: [RESOURCE] } },
        options: [
            {
                name: "Create",
                value: "create",
                description: "Open a new session",
                action: "Create a session",
            },
            {
                name: "List Turns",
                value: "turns",
                description: "List turns recorded against a session",
                action: "List session turns",
            },
            {
                name: "Get Context",
                value: "context",
                description: "Retrieve session-scoped context text for a query",
                action: "Get session context",
            },
            {
                name: "Close",
                value: "close",
                description: "Delete a session on the server",
                action: "Close a session",
            },
        ],
        default: "create",
    },
];

export const sessionFields: INodeProperties[] = [
    scopesField({ resource: RESOURCE, operations: ["create"] }),
    {
        displayName: "Metadata (JSON)",
        name: "metadata",
        type: "json",
        default: "{}",
        description: "Arbitrary metadata to attach to the session",
        displayOptions: {
            show: { resource: [RESOURCE], operation: ["create"] },
        },
    },
    stringField(
        "sessionId",
        "Session ID",
        { resource: RESOURCE, operations: ["turns", "context", "close"] },
        { required: true },
    ),
    textField(
        "query",
        "Query",
        { resource: RESOURCE, operations: ["context"] },
        { required: true },
    ),
];
