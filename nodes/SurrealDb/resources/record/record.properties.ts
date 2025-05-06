import type { INodeProperties } from "n8n-workflow";

/**
 * Operations available for the Record resource
 */
export const recordOperations: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ["record"],
      },
    },
    options: [
      {
        name: "Create Record",
        value: "createRecord",
        description: "Create a new record",
        action: "Create record",
      },
      {
        name: "Get Record",
        value: "getRecord",
        description: "Retrieve a specific record",
        action: "Get record",
      },
      {
        name: "Update Record",
        value: "updateRecord",
        description: "Replace the content of a specific record",
        action: "Update record",
      },
      {
        name: "Merge Record",
        value: "mergeRecord",
        description: "Merge data into a specific record",
        action: "Merge record",
      },
      {
        name: "Delete Record",
        value: "deleteRecord",
        description: "Delete a specific record",
        action: "Delete record",
      },
      {
        name: "Upsert Record",
        value: "upsertRecord",
        description:
          "Create a record if it doesn't exist, or update it if it does",
        action: "Upsert record",
      },
    ],
    default: "createRecord",
  },
];

/**
 * Fields available for the Record resource
 */
export const recordFields: INodeProperties[] = [
  // Table field for operations that use Record IDs (optional)
  {
    displayName: "Table",
    name: "table",
    type: "string",
    required: false,
    default: "",
    description:
      'SurrealDB table name (e.g., "person", "product"). You can also use a full record ID (e.g., "person:john") and the table part will be extracted automatically. Optional if Record ID includes a table prefix.',
    displayOptions: {
      show: {
        resource: ["record"],
        operation: [
          "getRecord",
          "updateRecord",
          "mergeRecord",
          "deleteRecord",
          "upsertRecord",
        ],
      },
    },
  },
  // Table field for createRecord operation (required)
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
        resource: ["record"],
        operation: ["createRecord"],
      },
    },
  },
  // Optional Record ID field for createRecord operation
  {
    displayName: "Record ID (Optional)",
    name: "id",
    type: "string",
    required: false,
    default: "",
    description:
      'Optional ID for the new record. If not provided, SurrealDB will auto-generate an ID. Can include table prefix (e.g., "person:john", "product:abc123").',
    displayOptions: {
      show: {
        resource: ["record"],
        operation: ["createRecord"],
      },
    },
  },
  {
    displayName: "Record ID",
    name: "id",
    type: "string",
    required: true,
    default: "",
    description:
      'ID of the record. Can include table prefix (e.g., "person:john", "product:abc123"). If Table field is empty, the table part will be extracted from the Record ID.',
    displayOptions: {
      show: {
        resource: ["record"],
        operation: [
          "getRecord",
          "updateRecord",
          "mergeRecord",
          "deleteRecord",
          "upsertRecord",
        ],
      },
    },
  },
  // Data field for operations that require data input
  {
    displayName: "Data (JSON)",
    name: "data",
    type: "json",
    required: true,
    default: "{}",
    description: "Data to create or update the record with",
    displayOptions: {
      show: {
        resource: ["record"],
        operation: [
          "createRecord",
          "updateRecord",
          "mergeRecord",
          "upsertRecord",
        ],
      },
    },
  },
  // Options for Record resource
  {
    displayName: "Options",
    name: "options",
    type: "collection",
    placeholder: "Add Option",
    default: {},
    description: "Additional options for record operations",
    displayOptions: {
      show: {
        resource: ["record"],
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
