import type { INodeProperties } from "n8n-workflow";

export const fieldOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["field"],
            },
        },
        options: [
            {
                name: "List Fields",
                value: "listFields",
                description: "List all fields on a table",
                action: "List all fields",
            },
            {
                name: "Create Field",
                value: "createField",
                description: "Create a new field on a table",
                action: "Create a field",
            },
            {
                name: "Delete Field",
                value: "deleteField",
                description: "Delete a field from a table",
                action: "Delete a field",
            },
        ],
        default: "listFields",
    },
];

export const fieldFields: INodeProperties[] = [
    // Common fields for all Field resource operations
    {
        displayName: "Table",
        name: "table",
        type: "string",
        required: true,
        default: "",
        description: "Name of the table where the field will be operated on",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField", "listFields", "deleteField"],
            },
        },
    },
    {
        displayName: "Field Name",
        name: "fieldName",
        type: "string",
        required: true,
        default: "",
        description: "Name of the field",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField", "deleteField"],
            },
        },
    },
    {
        displayName: "Field Mode",
        name: "fieldMode",
        type: "options",
        options: [
            {
                name: "Standard",
                value: "standard",
                description: "Regular field with direct storage",
            },
            {
                name: "Computed",
                value: "computed",
                description: "Field calculated from an expression",
            },
        ],
        default: "standard",
        description: "Whether the field stores data directly or is computed",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField"],
            },
        },
    },
    {
        displayName: "Field Type",
        name: "fieldType",
        type: "options",
        options: [
            {
                name: "Any",
                value: "any",
                description: "Any data type",
            },
            {
                name: "Array",
                value: "array",
                description: "Array of values",
            },
            {
                name: "Boolean",
                value: "bool",
                description: "True/false value",
            },
            {
                name: "DateTime",
                value: "datetime",
                description: "Date and time value",
            },
            {
                name: "Decimal",
                value: "decimal",
                description: "Decimal number with high precision",
            },
            {
                name: "Duration",
                value: "duration",
                description: "Time duration value",
            },
            {
                name: "Float",
                value: "float",
                description: "Floating point number",
            },
            {
                name: "Integer",
                value: "int",
                description: "Whole number",
            },
            {
                name: "Number",
                value: "number",
                description: "Generic number (int or float)",
            },
            {
                name: "Object",
                value: "object",
                description: "JSON object",
            },
            {
                name: "Record",
                value: "record",
                description: "Link to another record",
            },
            {
                name: "String",
                value: "string",
                description: "Text value",
            },
        ],
        default: "string",
        description: "Data type of the field",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField"],
            },
        },
    },
    {
        displayName: "Record Table Type",
        name: "recordTableType",
        type: "string",
        default: "",
        placeholder: "person",
        description:
            "Type of record this field can reference (e.g., person, product)",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField"],
                fieldType: ["record"],
            },
        },
    },
    {
        displayName: "Computation Expression",
        name: "computeExpression",
        type: "string",
        typeOptions: {
            rows: 4,
        },
        default: "",
        placeholder: 'string::concat($this.first_name, " ", $this.last_name)',
        description:
            "SurrealQL expression that computes the field value. Use $this to refer to the current record",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField"],
                fieldMode: ["computed"],
            },
        },
    },
    // Special properties that should always be visible outside of Options collection
    {
        displayName: "Is Flexible",
        name: "isFlexible",
        type: "boolean",
        default: false,
        description:
            "Whether the field accepts any data type even if it doesn't match the defined type",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField"],
            },
        },
    },
    {
        displayName: "Is Read-Only",
        name: "isReadOnly",
        type: "boolean",
        default: false,
        description:
            "Whether the field can't be modified after it's initially set",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField"],
            },
        },
    },
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for the field",
        displayOptions: {
            show: {
                resource: ["field"],
                operation: ["createField", "listFields", "deleteField"],
            },
        },
        options: [
            {
                displayName: "Default Value",
                name: "defaultValue",
                type: "string",
                default: "",
                description:
                    "Default value for the field when not specified (as a SurrealQL expression)",
                displayOptions: {
                    show: {
                        "/operation": ["createField"],
                    },
                },
            },
            {
                displayName: "Assertion",
                name: "assertion",
                type: "string",
                typeOptions: {
                    rows: 2,
                },
                default: "",
                placeholder: "$value > 0 AND $value < 100",
                description:
                    "Validation rule for the field (as a SurrealQL expression)",
                displayOptions: {
                    show: {
                        "/operation": ["createField"],
                    },
                },
            },
            {
                displayName: "Is Array",
                name: "isArray",
                type: "boolean",
                default: false,
                description:
                    "Whether the field should be an array of the specified type",
                displayOptions: {
                    show: {
                        "/operation": ["createField"],
                    },
                },
            },
            {
                displayName: "Is Optional",
                name: "isOptional",
                type: "boolean",
                default: false,
                description: "Whether the field can be null/undefined",
                displayOptions: {
                    show: {
                        "/operation": ["createField"],
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
