import type { INodeProperties } from "n8n-workflow";

/**
 * Operations available for the System resource
 */
export const systemOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["system"],
            },
        },
        options: [
            {
                name: "Health Check",
                value: "healthCheck",
                description: "Check if the database instance is responsive",
                action: "Check health",
            },
            {
                name: "Get Version",
                value: "version",
                description: "Get the version of the SurrealDB instance",
                action: "Get SurrealDB version",
            },
            {
                name: "Get Pool Statistics",
                value: "poolStats",
                description:
                    "Get connection pool statistics and performance metrics",
                action: "Get pool statistics",
            },
        ],
        default: "healthCheck",
    },
];

/**
 * Fields available for the System resource
 */
export const systemFields: INodeProperties[] = [
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for system operations",
        displayOptions: {
            show: {
                resource: ["system"],
            },
        },
        options: [
            {
                displayName: "Namespace",
                name: "namespace",
                type: "string",
                default: "",
                placeholder: "e.g., my_namespace",
                description:
                    "Optional namespace to use for this operation, overriding the credential setting",
            },
            {
                displayName: "Database",
                name: "database",
                type: "string",
                default: "",
                placeholder: "e.g., my_database",
                description:
                    "Optional database to use for this operation, overriding the credential setting",
            },
        ],
    },
];
