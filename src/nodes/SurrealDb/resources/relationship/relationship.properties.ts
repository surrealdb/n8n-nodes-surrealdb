import type { INodeProperties } from "n8n-workflow";

/**
 * Operations available for the Relationship resource
 */
export const relationshipOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["relationship"],
            },
        },
        options: [
            {
                name: "Create Relationship",
                value: "createRelationship",
                description: "Create a relationship between two records",
                action: "Create a relationship",
            },
            {
                name: "Delete Relationship",
                value: "deleteRelationship",
                description: "Delete a relationship between records",
                action: "Delete a relationship",
            },
            {
                name: "Query Relationships",
                value: "queryRelationships",
                description: "Query relationships between records",
                action: "Query relationships",
            },
        ],
        default: "createRelationship",
    },
];

/**
 * Fields available for the Relationship resource
 */
export const relationshipFields: INodeProperties[] = [
    // Fields for createRelationship operation
    {
        displayName: "From Record ID",
        name: "fromRecordId",
        type: "string",
        required: true,
        default: "",
        placeholder: "e.g., person:john, article:123",
        description:
            'The ID of the record to create the relationship from. Must be in the format "table:id"',
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["createRelationship"],
            },
        },
    },
    {
        displayName: "Relationship Type",
        name: "relationshipType",
        type: "string",
        required: false,
        default: "",
        placeholder: "e.g., knows, likes, wrote",
        description:
            "The type of relationship to create. At least one of From Record ID, Relationship Type, or To Record ID must be provided",
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["createRelationship", "deleteRelationship"],
            },
        },
    },
    {
        displayName: "To Record ID",
        name: "toRecordId",
        type: "string",
        required: true,
        default: "",
        placeholder: "e.g., person:jane, product:456",
        description:
            'The ID of the record to create the relationship to. Must be in the format "table:id"',
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["createRelationship"],
            },
        },
    },
    {
        displayName: "Properties",
        name: "properties",
        type: "fixedCollection",
        placeholder: "Add Property",
        default: {},
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["createRelationship"],
            },
        },
        options: [
            {
                name: "propertyValues",
                displayName: "Property",
                values: [
                    {
                        displayName: "Property Name or JSON Key",
                        name: "key",
                        type: "string",
                        default: "",
                        description: "Name of the property to set",
                    },
                    {
                        displayName: "Property Value",
                        name: "value",
                        type: "string",
                        default: "",
                        description: "Value of the property to set",
                    },
                ],
            },
        ],
    },

    // Fields for deleteRelationship operation
    {
        displayName: "From Record ID",
        name: "fromRecordId",
        type: "string",
        required: false,
        default: "",
        placeholder: "e.g., person:john, article:123",
        description:
            'The ID of the record to delete the relationship from. Must be in the format "table:id". At least one of From Record ID, Relationship Type, or To Record ID must be provided',
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["deleteRelationship"],
            },
        },
    },
    {
        displayName: "To Record ID",
        name: "toRecordId",
        type: "string",
        required: false,
        default: "",
        placeholder: "e.g., person:jane, product:456",
        description:
            'The ID of the record to delete the relationship to. Must be in the format "table:id". At least one of From Record ID, Relationship Type, or To Record ID must be provided',
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["deleteRelationship"],
            },
        },
    },

    // Fields for queryRelationships operation
    {
        displayName: "Record ID",
        name: "recordId",
        type: "string",
        required: false,
        default: "",
        placeholder: "e.g., person:john, article:123",
        description:
            'The ID of the record to query relationships for. Must be in the format "table:id". Leave empty to query all relationships of the specified type',
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["queryRelationships"],
            },
        },
    },
    {
        displayName: "Direction",
        name: "direction",
        type: "options",
        options: [
            {
                name: "Outgoing",
                value: "outgoing",
                description: "Relationships from this record to others (->)",
            },
            {
                name: "Incoming",
                value: "incoming",
                description: "Relationships from others to this record (<-)",
            },
            {
                name: "Both",
                value: "both",
                description: "Relationships in both directions (<->)",
            },
        ],
        default: "outgoing",
        description: "The direction of relationships to query",
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["queryRelationships"],
            },
        },
    },
    {
        displayName: "Relationship Type",
        name: "relationshipType",
        type: "string",
        required: false,
        default: "",
        placeholder: "e.g., knows, likes, wrote",
        description:
            "The type of relationship to query (leave empty to query all relationship types)",
        displayOptions: {
            show: {
                resource: ["relationship"],
                operation: ["queryRelationships"],
            },
        },
    },

    // Options collection for all relationship operations
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for relationship operations",
        displayOptions: {
            show: {
                resource: ["relationship"],
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
            {
                displayName: "Return",
                name: "returnType",
                type: "options",
                options: [
                    {
                        name: "After",
                        value: "AFTER",
                        description:
                            "Return the record after changes were applied (default)",
                    },
                    {
                        name: "Before",
                        value: "BEFORE",
                        description:
                            "Return the record before changes were applied",
                    },
                    {
                        name: "Diff",
                        value: "DIFF",
                        description:
                            "Return the difference between the record before and after changes",
                    },
                    {
                        name: "None",
                        value: "NONE",
                        description: "Return nothing",
                    },
                ],
                default: "AFTER",
                description: "What to return after the operation",
                displayOptions: {
                    show: {
                        "/operation": [
                            "createRelationship",
                            "deleteRelationship",
                        ],
                    },
                },
            },
            {
                displayName: "Only",
                name: "only",
                type: "boolean",
                default: false,
                description:
                    "Return a single object instead of an array with a single object",
                displayOptions: {
                    show: {
                        "/operation": ["createRelationship"],
                    },
                },
            },
            {
                displayName: "Target Table",
                name: "targetTable",
                type: "string",
                default: "",
                placeholder: "e.g., person, product",
                description:
                    "The target table to filter relationships to (for queryRelationships)",
                displayOptions: {
                    show: {
                        "/operation": ["queryRelationships"],
                    },
                },
            },
            {
                displayName: "Include Properties",
                name: "includeProperties",
                type: "boolean",
                default: true,
                description:
                    "Whether to include relationship properties in the query results",
                displayOptions: {
                    show: {
                        "/operation": ["queryRelationships"],
                    },
                },
            },
            {
                displayName: "Return Each Relationship As Item",
                name: "splitIntoItems",
                type: "boolean",
                default: false,
                description:
                    "Whether to return each relationship as a separate item or all relationships as a single item with an array property",
                displayOptions: {
                    show: {
                        "/operation": ["queryRelationships"],
                    },
                },
            },
        ],
    },
];
