import type { INodeProperties } from "n8n-workflow";

export const indexOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["index"],
            },
        },
        options: [
            {
                name: "List Indexes",
                value: "listIndexes",
                description: "List all indexes on a table",
                action: "List all indexes",
            },
            {
                name: "Create Index",
                value: "createIndex",
                description: "Create a new index on a table",
                action: "Create an index",
            },
            {
                name: "Drop Index",
                value: "dropIndex",
                description: "Drop an index from a table",
                action: "Drop an index",
            },
            {
                name: "Describe Index",
                value: "describeIndex",
                description: "Retrieve detailed information about an index",
                action: "Describe an index",
            },
            {
                name: "Rebuild Index",
                value: "rebuildIndex",
                description: "Rebuild an existing index",
                action: "Rebuild an index",
            },
        ],
        default: "listIndexes",
    },
];

export const indexFields: INodeProperties[] = [
    // Common fields for all Index resource operations
    {
        displayName: "Table",
        name: "table",
        type: "string",
        required: true,
        default: "",
        description: "Name of the table where the index will be operated on",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: [
                    "createIndex",
                    "dropIndex",
                    "listIndexes",
                    "describeIndex",
                    "rebuildIndex",
                ],
            },
        },
    },
    {
        displayName: "Index Name",
        name: "indexName",
        type: "string",
        required: true,
        default: "",
        description: "Name of the index",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: [
                    "createIndex",
                    "dropIndex",
                    "describeIndex",
                    "rebuildIndex",
                ],
            },
        },
    },
    // Create Index specific fields
    {
        displayName: "Index Fields",
        name: "indexFields",
        type: "string",
        required: true,
        default: "",
        description:
            'Comma-separated list of fields to index (e.g., "name, email")',
        displayOptions: {
            show: {
                resource: ["index"],
                operation: ["createIndex"],
            },
        },
    },
    {
        displayName: "Index Type",
        name: "indexType",
        type: "options",
        options: [
            {
                name: "Standard (B-Tree)",
                value: "standard",
                description: "Regular B-Tree index for general-purpose use",
            },
            {
                name: "Full-Text Search",
                value: "search",
                description: "Enables full-text search capabilities",
            },
            {
                name: "Vector (MTREE)",
                value: "mtree",
                description: "M-Tree index for vector/similarity searches",
            },
        ],
        default: "standard",
        description: "The type of index to create",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: ["createIndex"],
            },
        },
    },
    {
        displayName: "Vector Dimension",
        name: "vectorDimension",
        type: "number",
        default: 0,
        description:
            "The dimensionality of the vector data when creating an MTREE index",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: ["createIndex"],
                indexType: ["mtree"],
            },
        },
    },
    {
        displayName: "Distance Function",
        name: "distanceFunction",
        type: "options",
        options: [
            {
                name: "Euclidean",
                value: "euclidean",
                description: "Euclidean distance (L2 norm)",
            },
            {
                name: "Manhattan",
                value: "manhattan",
                description: "Manhattan distance (L1 norm)",
            },
            {
                name: "Cosine",
                value: "cosine",
                description: "Cosine similarity distance",
            },
        ],
        default: "euclidean",
        description:
            "The distance function to use for vector similarity searches",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: ["createIndex"],
                indexType: ["mtree"],
            },
        },
    },
    {
        displayName: "FTS Analyzer",
        name: "ftsAnalyzer",
        type: "string",
        default: "",
        description:
            "The text analyzer to use for full-text search index (must be defined in SurrealDB)",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: ["createIndex"],
                indexType: ["search"],
            },
        },
    },
    {
        displayName: "Enable Highlights",
        name: "enableHighlights",
        type: "boolean",
        default: false,
        description: "Whether to enable highlighting in search results",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: ["createIndex"],
                indexType: ["search"],
            },
        },
    },
    // Options collection for all index operations
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for the index operation",
        displayOptions: {
            show: {
                resource: ["index"],
                operation: [
                    "createIndex",
                    "dropIndex",
                    "listIndexes",
                    "describeIndex",
                    "rebuildIndex",
                ],
            },
        },
        options: [
            {
                displayName: "Is Unique",
                name: "isUnique",
                type: "boolean",
                default: false,
                description: "Whether the index enforces unique values",
                displayOptions: {
                    show: {
                        "/operation": ["createIndex"],
                    },
                },
            },
            {
                displayName: "Create Concurrently",
                name: "concurrently",
                type: "boolean",
                default: false,
                description:
                    "Whether to build the index in the background without blocking writes",
                displayOptions: {
                    show: {
                        "/operation": ["createIndex"],
                    },
                },
            },
            {
                displayName: "If Not Exists",
                name: "ifNotExists",
                type: "boolean",
                default: false,
                description:
                    "Only create the index if it does not already exist",
                displayOptions: {
                    show: {
                        "/operation": ["createIndex"],
                    },
                },
            },
            {
                displayName: "Overwrite",
                name: "overwrite",
                type: "boolean",
                default: false,
                description: "Overwrite the index if it already exists",
                displayOptions: {
                    show: {
                        "/operation": ["createIndex"],
                    },
                },
            },
            {
                displayName: "If Exists",
                name: "ifExists",
                type: "boolean",
                default: false,
                description: "Only drop or rebuild the index if it exists",
                displayOptions: {
                    show: {
                        "/operation": ["dropIndex", "rebuildIndex"],
                    },
                },
            },
            {
                displayName: "Use Alternative Syntax",
                name: "useAlternativeSyntax",
                type: "boolean",
                default: false,
                description:
                    'Use alternative syntax "REMOVE INDEX name ON table" for older SurrealDB versions',
                displayOptions: {
                    show: {
                        "/operation": ["dropIndex"],
                    },
                },
            },
            {
                displayName: "Vector Type",
                name: "vectorType",
                type: "options",
                options: [
                    {
                        name: "Float 32",
                        value: "f32",
                        description: "32-bit floating point",
                    },
                    {
                        name: "Float 64",
                        value: "f64",
                        description: "64-bit floating point",
                    },
                    {
                        name: "Int 64",
                        value: "i64",
                        description: "64-bit signed integer",
                    },
                ],
                default: "f32",
                description:
                    "Data type for storing vector components in MTREE index",
                displayOptions: {
                    show: {
                        "/operation": ["createIndex"],
                        "/indexType": ["mtree"],
                    },
                },
            },
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
