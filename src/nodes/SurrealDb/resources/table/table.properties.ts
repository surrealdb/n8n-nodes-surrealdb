import type { INodeProperties } from "n8n-workflow";

export const tableOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["table"],
            },
        },
        options: [
            // Table management operations
            {
                name: "List Tables",
                value: "listTables",
                description: "List all tables in the database",
                action: "List all tables",
            },
            {
                name: "Get Table",
                value: "getTable",
                description: "Get detailed definition of a specific table",
                action: "Get table definition",
            },
            {
                name: "Create Table",
                value: "createTable",
                description: "Create a new table in the database",
                action: "Create a table",
            },
            {
                name: "Delete Table",
                value: "deleteTable",
                description: "Delete a table from the database",
                action: "Delete a table",
            },
            // Record operations
            {
                name: "Get All Records",
                value: "getAllRecords",
                description: "Retrieve all records from a table",
                action: "Get all records",
            },
            {
                name: "Create Many Records",
                value: "createMany",
                description: "Create multiple records in a single operation",
                action: "Create many records",
            },
            {
                name: "Get Many Records",
                value: "getMany",
                description: "Retrieve multiple specific records by their IDs",
                action: "Get many records",
            },
            {
                name: "Update All Records",
                value: "updateAllRecords",
                description: "Update all records in a table with the same data",
                action: "Update all records",
            },
            {
                name: "Delete All Records",
                value: "deleteAllRecords",
                description: "Delete all records in a table",
                action: "Delete all records",
            },
            {
                name: "Merge All Records",
                value: "mergeAllRecords",
                description: "Merge the same data into all records in a table",
                action: "Merge all records",
            },
        ],
        default: "getAllRecords",
    },
];

export const tableFields: INodeProperties[] = [
    // Common fields for Table resource
    // Table field for operations that don't use Record IDs
    {
        displayName: "Table",
        name: "table",
        type: "string",
        required: true,
        default: "",
        description:
            'SurrealDB table name (e.g., "person", "product", "order"). You can also use a full record ID (e.g., "person:john") and the table part will be extracted automatically.',
        displayOptions: {
            show: {
                resource: ["table"],
                operation: [
                    "getAllRecords",
                    "createMany",
                    "updateAllRecords",
                    "deleteAllRecords",
                    "mergeAllRecords",
                    "createTable",
                    "deleteTable",
                    "getTable",
                ],
            },
        },
    },
    // Table field for getMany operation (optional)
    {
        displayName: "Table",
        name: "table",
        type: "string",
        required: false,
        default: "",
        description:
            'SurrealDB table name (e.g., "person", "product"). You can also use a full record ID (e.g., "person:john") and the table part will be extracted automatically. Optional if Record IDs include a table prefix.',
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["getMany"],
            },
        },
    },

    // Fields for Table operations
    {
        displayName: "Records Data (JSON)",
        name: "data",
        type: "json",
        required: true,
        default: "[]",
        description: "Array of record objects to create",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["createMany"],
            },
        },
    },
    {
        displayName: "Update Data (JSON)",
        name: "data",
        type: "json",
        required: true,
        default: "{}",
        description: "Data to update all records in the table with",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["updateAllRecords"],
            },
        },
    },
    {
        displayName: "Merge Data (JSON)",
        name: "data",
        type: "json",
        required: true,
        default: "{}",
        description: "Data to merge into all records in the table",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["mergeAllRecords"],
            },
        },
    },
    {
        displayName: "Record IDs",
        name: "ids",
        type: "string",
        required: true,
        default: "",
        placeholder: "id1,id2,id3 or table:id1,table:id2,table:id3",
        description:
            'Comma-separated list of record IDs. Can include table prefix (e.g., "person:john", "product:abc123"). If Table field is empty, the table part will be extracted from the Record IDs.',
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["getMany"],
            },
        },
    },
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for retrieving records",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["getAllRecords"],
            },
        },
        options: [
            {
                displayName: "Limit",
                name: "limit",
                type: "number",
                typeOptions: {
                    minValue: 1,
                },
                default: 100,
                description: "Maximum number of records to return",
            },
            {
                displayName: "Start",
                name: "start",
                type: "number",
                default: 0,
                description: "Number of records to skip",
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

    // Add Options for Table resource (createMany and getMany operations)
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for table operations",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["createMany", "getMany", "getTable"],
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
    // Add Options for updateAllRecords operation
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for updating all records",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["updateAllRecords"],
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
    // Add Options for deleteAllRecords operation
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for deleting all records",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["deleteAllRecords"],
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
    // Add Options for mergeAllRecords operation
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for merging data into all records",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["mergeAllRecords"],
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
    // Add Options for createTable operation
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for creating a table",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["createTable"],
            },
        },
        options: [
            {
                displayName: "Table Type",
                name: "tableType",
                type: "options",
                options: [
                    {
                        name: "Normal",
                        value: "NORMAL",
                        description: "Standard data table for most use cases",
                    },
                    {
                        name: "Any",
                        value: "ANY",
                        description:
                            "Flexible table that can store any type of data",
                    },
                    {
                        name: "Relation",
                        value: "RELATION",
                        description:
                            "Specialized table for graph relationships between records",
                    },
                ],
                default: "NORMAL",
                description: "The type of table to create",
            },
            {
                displayName: "Schema Mode",
                name: "schemaMode",
                type: "options",
                options: [
                    {
                        name: "Schemaless",
                        value: "SCHEMALESS",
                        description:
                            "Flexible structure allowing any fields (default)",
                    },
                    {
                        name: "Schemafull",
                        value: "SCHEMAFULL",
                        description:
                            "Strict structure that enforces a defined schema",
                    },
                ],
                default: "SCHEMALESS",
                description: "Whether the table should enforce a schema",
            },
            {
                displayName: "Schema (JSON)",
                name: "schema",
                type: "json",
                default: "",
                displayOptions: {
                    show: {
                        schemaMode: ["SCHEMAFULL"],
                    },
                },
                description:
                    'Schema definition for the table in JSON format. Example: {"fields": {"name": "string", "age": "number"}}',
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
    // Add Options for deleteTable operation
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for deleting a table",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["deleteTable"],
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
    // Add Options for listTables operation
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for listing tables",
        displayOptions: {
            show: {
                resource: ["table"],
                operation: ["listTables"],
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
