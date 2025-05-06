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
    ],
    default: "executeQuery",
  },
];

/**
 * Fields available for the Query resource
 */
export const queryFields: INodeProperties[] = [
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
    type: "json",
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
];
