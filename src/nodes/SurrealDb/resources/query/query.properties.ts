import type { INodeProperties } from "n8n-workflow";

/**
 * Operations available for the Query resource
 */
export const queryOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["query"],
            },
        },
        options: [
            {
                name: "Execute Query",
                value: "executeQuery",
                description: "Execute a raw SurrealQL query",
                action: "Execute SurrealQL query",
            },
            {
                name: "Build Select Query",
                value: "buildSelectQuery",
                description: "Build a SELECT query using a visual interface",
                action: "Build SELECT query",
            },
        ],
        default: "executeQuery",
    },
];

/**
 * Fields available for the Query resource
 */
export const queryFields: INodeProperties[] = [
    // Execute Query fields
    {
        displayName: "Query",
        name: "query",
        type: "string",
        typeOptions: {
            alwaysOpenEditWindow: true,
        },
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["executeQuery"],
            },
        },
        default: "",
        placeholder: "SELECT * FROM person WHERE age > $age",
        required: true,
        description: "SurrealQL query to execute",
    },
    {
        displayName: "Parameters (JSON)",
        name: "parameters",
        type: "string",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["executeQuery"],
            },
        },
        default: "{}",
        placeholder: '{ "age": 18 }',
        description: "Parameters for the query as a JSON object",
    },
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for query execution",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["executeQuery"],
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
                description:
                    "Maximum number of records to return (only applied if query doesn't already have LIMIT)",
            },
            {
                displayName: "Start",
                name: "start",
                type: "number",
                default: 0,
                description:
                    "Number of records to skip (only applied if query doesn't already have START)",
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

    // Build Select Query fields
    {
        displayName: "Table",
        name: "table",
        type: "string",
        required: true,
        default: "",
        placeholder: "person",
        description: "The table to select from",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
    },
    {
        displayName: "Fields",
        name: "fields",
        type: "string",
        default: "*",
        placeholder: "name, age, email or * for all fields",
        description:
            "Comma-separated list of fields to select, or * for all fields",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
    },
    {
        displayName: "Where Conditions",
        name: "whereConditions",
        type: "fixedCollection",
        typeOptions: {
            multipleValues: true,
        },
        placeholder: "Add Where Condition",
        default: {},
        description: "Conditions to filter the results",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
        options: [
            {
                displayName: "Condition",
                name: "condition",
                values: [
                    {
                        displayName: "Field",
                        name: "field",
                        type: "string",
                        default: "",
                        placeholder: "age",
                        description: "Field name to filter on",
                    },
                    {
                        displayName: "Operator",
                        name: "operator",
                        type: "options",
                        options: [
                            { name: "Equals", value: "=" },
                            { name: "Not Equals", value: "!=" },
                            { name: "Greater Than", value: ">" },
                            { name: "Greater Than or Equal", value: ">=" },
                            { name: "Less Than", value: "<" },
                            { name: "Less Than or Equal", value: "<=" },
                            { name: "Contains", value: "CONTAINS" },
                            { name: "Not Contains", value: "!CONTAINS" },
                            { name: "Inside", value: "INSIDE" },
                            { name: "Not Inside", value: "!INSIDE" },
                            { name: "Outside", value: "OUTSIDE" },
                            { name: "Intersects", value: "INTERSECTS" },
                            { name: "Is Null", value: "IS NULL" },
                            { name: "Is Not Null", value: "IS NOT NULL" },
                        ],
                        default: "=",
                        description: "Comparison operator",
                    },
                    {
                        displayName: "Value",
                        name: "value",
                        type: "string",
                        default: "",
                        placeholder: "25",
                        description: "Value to compare against",
                        displayOptions: {
                            show: {
                                operator: [
                                    "=",
                                    "!=",
                                    ">",
                                    ">=",
                                    "<",
                                    "<=",
                                    "CONTAINS",
                                    "!CONTAINS",
                                    "INSIDE",
                                    "!INSIDE",
                                    "OUTSIDE",
                                    "INTERSECTS",
                                ],
                            },
                        },
                    },
                    {
                        displayName: "Logical Operator",
                        name: "logicalOperator",
                        type: "options",
                        options: [
                            { name: "AND", value: "AND" },
                            { name: "OR", value: "OR" },
                        ],
                        default: "AND",
                        description:
                            "Logical operator to combine with next condition",
                    },
                ],
            },
        ],
    },
    {
        displayName: "Order By",
        name: "orderBy",
        type: "fixedCollection",
        typeOptions: {
            multipleValues: true,
        },
        placeholder: "Add Order By",
        default: {},
        description: "Sort order for the results",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
        options: [
            {
                displayName: "Order",
                name: "order",
                values: [
                    {
                        displayName: "Field",
                        name: "field",
                        type: "string",
                        default: "",
                        placeholder: "name",
                        description: "Field to sort by",
                    },
                    {
                        displayName: "Direction",
                        name: "direction",
                        type: "options",
                        options: [
                            { name: "Ascending", value: "ASC" },
                            { name: "Descending", value: "DESC" },
                        ],
                        default: "ASC",
                        description: "Sort direction",
                    },
                ],
            },
        ],
    },
    {
        displayName: "Group By",
        name: "groupBy",
        type: "string",
        default: "",
        placeholder: "department, status",
        description: "Comma-separated list of fields to group by",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
    },

    {
        displayName: "Limit",
        name: "limit",
        type: "number",
        typeOptions: {
            minValue: 1,
        },
        default: 100,
        description: "Maximum number of records to return",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
    },
    {
        displayName: "Start",
        name: "start",
        type: "number",
        default: 0,
        description: "Number of records to skip",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
    },
    {
        displayName: "Split On",
        name: "splitOn",
        type: "string",
        default: "",
        placeholder: "department, status",
        description: "Comma-separated list of fields to split results on",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
    },
    {
        displayName: "Parameters (JSON)",
        name: "parameters",
        type: "string",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
            },
        },
        default: "{}",
        placeholder: '{ "min_age": 18, "status": "active" }',
        description:
            "Parameters for the query as a JSON object (use $param_name in conditions)",
    },
    {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        description: "Additional options for the select query",
        displayOptions: {
            show: {
                resource: ["query"],
                operation: ["buildSelectQuery"],
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
                displayName: "Return Generated Query",
                name: "returnGeneratedQuery",
                type: "boolean",
                default: false,
                description:
                    "Whether to return the generated SurrealQL query in the output",
            },
        ],
    },
];
