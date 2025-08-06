import type { INodeProperties } from "n8n-workflow";

/**
 * Operations available for the Batch resource
 */
export const batchOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["batch"],
            },
        },
        options: [
            {
                name: "Batch Create",
                value: "batchCreate",
                description:
                    "Create multiple records with configurable batch processing",
                action: "Create multiple records in batches",
            },
            {
                name: "Batch Update",
                value: "batchUpdate",
                description:
                    "Update multiple records with configurable batch processing",
                action: "Update multiple records in batches",
            },
            {
                name: "Batch Delete",
                value: "batchDelete",
                description:
                    "Delete multiple records with configurable batch processing",
                action: "Delete multiple records in batches",
            },
            {
                name: "Batch Upsert",
                value: "batchUpsert",
                description:
                    "Create or update multiple records with configurable batch processing",
                action: "Upsert multiple records in batches",
            },
        ],
        default: "batchCreate",
    },
];

/**
 * Fields available for the Batch resource
 */
export const batchFields: INodeProperties[] = [
    // Table field for all batch operations
    {
        displayName: "Table",
        name: "table",
        type: "string",
        required: true,
        default: "",
        description:
            'SurrealDB table name (e.g., "person", "product", "order").',
        displayOptions: {
            show: {
                resource: ["batch"],
            },
        },
    },
    // Records data field for batch create and upsert operations
    {
        displayName: "Records Data (JSON)",
        name: "data",
        type: "json",
        required: true,
        default: "[]",
        description: "Array of record objects to create or upsert",
        displayOptions: {
            show: {
                resource: ["batch"],
                operation: ["batchCreate", "batchUpsert"],
            },
        },
    },
    // Records data field for batch update operations
    {
        displayName: "Records Data (JSON)",
        name: "data",
        type: "json",
        required: true,
        default: "[]",
        description: "Array of record objects with IDs to update",
        displayOptions: {
            show: {
                resource: ["batch"],
                operation: ["batchUpdate"],
            },
        },
    },
    // Record IDs field for batch delete operations
    {
        displayName: "Record IDs",
        name: "ids",
        type: "string",
        required: true,
        default: "",
        placeholder: "id1,id2,id3 or table:id1,table:id2,table:id3",
        description:
            'Comma-separated list of record IDs to delete. Can include table prefix (e.g., "person:john", "product:abc123").',
        displayOptions: {
            show: {
                resource: ["batch"],
                operation: ["batchDelete"],
            },
        },
    },
    // Batch configuration options
    {
        displayName: "Batch Configuration",
        name: "batchConfig",
        type: "collection",
        placeholder: "Add Batch Configuration",
        default: {},
        description: "Configure batch processing behavior",
        displayOptions: {
            show: {
                resource: ["batch"],
            },
        },
        options: [
            {
                displayName: "Batch Size",
                name: "batchSize",
                type: "number",
                typeOptions: {
                    minValue: 1,
                    maxValue: 1000,
                },
                default: 100,
                description: "Number of records to process in each batch",
            },
            {
                displayName: "Parallel Processing",
                name: "parallel",
                type: "boolean",
                default: false,
                description:
                    "Process batches in parallel for better performance",
            },
            {
                displayName: "Max Parallel Batches",
                name: "maxParallelBatches",
                type: "number",
                typeOptions: {
                    minValue: 1,
                    maxValue: 10,
                },
                default: 3,
                description: "Maximum number of batches to process in parallel",
                displayOptions: {
                    show: {
                        parallel: [true],
                    },
                },
            },
            {
                displayName: "Error Handling",
                name: "errorHandling",
                type: "options",
                options: [
                    {
                        name: "Stop on First Error",
                        value: "stop",
                        description:
                            "Stop processing when the first error occurs",
                    },
                    {
                        name: "Continue on Errors",
                        value: "continue",
                        description:
                            "Continue processing and collect all errors",
                    },
                    {
                        name: "Partial Success",
                        value: "partial",
                        description:
                            "Return partial results and continue processing",
                    },
                ],
                default: "stop",
                description: "How to handle errors during batch processing",
            },
            {
                displayName: "Transaction Mode",
                name: "transaction",
                type: "boolean",
                default: false,
                description:
                    "Execute all operations within a single transaction",
            },
            {
                displayName: "Progress Tracking",
                name: "progressTracking",
                type: "boolean",
                default: true,
                description:
                    "Track and report progress during batch processing",
            },
        ],
    },
    // General options
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for batch operations",
        displayOptions: {
            show: {
                resource: ["batch"],
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
