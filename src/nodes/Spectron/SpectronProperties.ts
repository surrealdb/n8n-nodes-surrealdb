import type { INodeProperties } from "n8n-workflow";

import {
    knowledgeOperations,
    knowledgeFields,
} from "./resources/knowledge";
import {
    sessionsOperations,
    sessionsFields,
} from "./resources/sessions";
import { contextOperations, contextFields } from "./resources/context";
import { memoryOperations, memoryFields } from "./resources/memory";

export const spectronNodeProperties: INodeProperties[] = [
    {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
            {
                name: "Knowledge",
                value: "knowledge",
                description: "Manage documents in the Spectron knowledge store",
            },
            {
                name: "Session",
                value: "sessions",
                description: "Create sessions and send conversational turns",
            },
            {
                name: "Context",
                value: "context",
                description: "Query and retrieve Spectron context",
            },
            {
                name: "Memory",
                value: "memory",
                description: "Inspect and update Spectron memory state",
            },
        ],
        default: "knowledge",
    },
    ...knowledgeOperations,
    ...sessionsOperations,
    ...contextOperations,
    ...memoryOperations,

    ...knowledgeFields,
    ...sessionsFields,
    ...contextFields,
    ...memoryFields,
];
