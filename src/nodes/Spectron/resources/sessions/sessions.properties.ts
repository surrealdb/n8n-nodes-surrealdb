import type { INodeProperties } from "n8n-workflow";

export const sessionsOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["sessions"],
            },
        },
        options: [
            {
                name: "Create",
                value: "create",
                description: "Create a new session",
                action: "Create a session",
            },
            {
                name: "Get",
                value: "get",
                description: "Get an existing session by ID",
                action: "Get a session",
            },
            {
                name: "Turn",
                value: "turn",
                description: "Send a turn to an existing session",
                action: "Send a turn to a session",
            },
        ],
        default: "create",
    },
];

export const sessionsFields: INodeProperties[] = [
    {
        displayName: "Scope",
        name: "scope",
        type: "json",
        default: "{}",
        description:
            "Optional scope object forwarded to sessions.create (JSON object)",
        displayOptions: {
            show: {
                resource: ["sessions"],
                operation: ["create"],
            },
        },
    },
    {
        displayName: "Session ID",
        name: "sessionId",
        type: "string",
        default: "",
        required: true,
        description: "The ID of the session",
        displayOptions: {
            show: {
                resource: ["sessions"],
                operation: ["get", "turn"],
            },
        },
    },
    {
        displayName: "Role",
        name: "role",
        type: "options",
        default: "user",
        options: [
            { name: "User", value: "user" },
            { name: "Assistant", value: "assistant" },
            { name: "System", value: "system" },
            { name: "Tool", value: "tool" },
        ],
        description: "Role of the turn being sent",
        displayOptions: {
            show: {
                resource: ["sessions"],
                operation: ["turn"],
            },
        },
    },
    {
        displayName: "Content",
        name: "content",
        type: "string",
        default: "",
        required: true,
        typeOptions: {
            rows: 4,
        },
        description: "Content of the turn",
        displayOptions: {
            show: {
                resource: ["sessions"],
                operation: ["turn"],
            },
        },
    },
    {
        displayName: "Additional Fields",
        name: "additionalFields",
        type: "json",
        default: "{}",
        description:
            "Optional extra fields forwarded to the turn call (JSON object)",
        displayOptions: {
            show: {
                resource: ["sessions"],
                operation: ["turn"],
            },
        },
    },
];
