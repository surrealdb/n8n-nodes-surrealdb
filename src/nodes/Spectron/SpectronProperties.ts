import type { INodeProperties } from "n8n-workflow";

import { memoryOperations, memoryFields } from "./resources/memory";
import { documentOperations, documentFields } from "./resources/document";
import { keywordOperations, keywordFields } from "./resources/keyword";
import { entityOperations, entityFields } from "./resources/entity";
import { sessionOperations, sessionFields } from "./resources/session";
import { traceOperations, traceFields } from "./resources/trace";
import { principalOperations, principalFields } from "./resources/principal";
import { scopeOperations, scopeFields } from "./resources/scope";
import { keyOperations, keyFields } from "./resources/key";
import {
    maintenanceOperations,
    maintenanceFields,
} from "./resources/maintenance";

export const spectronNodeProperties: INodeProperties[] = [
    {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
            {
                name: "Memory",
                value: "memory",
                description:
                    "Remember, recall, forget, reflect on, and chat over memory",
            },
            {
                name: "Document",
                value: "document",
                description: "Ingest, retrieve, and search documents",
            },
            {
                name: "Keyword",
                value: "keyword",
                description: "Explore the document keyword graph",
            },
            {
                name: "Entity",
                value: "entity",
                description: "Inspect entities, attributes, and relations",
            },
            {
                name: "Session",
                value: "session",
                description: "Create and manage conversation sessions",
            },
            {
                name: "Trace",
                value: "trace",
                description: "Inspect retrieval decision traces",
            },
            {
                name: "Principal",
                value: "principal",
                description: "Manage principals and scope grants",
            },
            {
                name: "Scope",
                value: "scope",
                description: "Manage the scope tree",
            },
            {
                name: "Key",
                value: "key",
                description: "Manage self-service API keys",
            },
            {
                name: "Maintenance",
                value: "maintenance",
                description:
                    "Health, state, profile, audit, and store maintenance sweeps",
            },
        ],
        default: "memory",
    },

    ...memoryOperations,
    ...documentOperations,
    ...keywordOperations,
    ...entityOperations,
    ...sessionOperations,
    ...traceOperations,
    ...principalOperations,
    ...scopeOperations,
    ...keyOperations,
    ...maintenanceOperations,

    ...memoryFields,
    ...documentFields,
    ...keywordFields,
    ...entityFields,
    ...sessionFields,
    ...traceFields,
    ...principalFields,
    ...scopeFields,
    ...keyFields,
    ...maintenanceFields,
];
