import type { INodeProperties } from "n8n-workflow";

// Import resource-specific properties from modular files
import { systemOperations, systemFields } from "./resources/system";
import { queryOperations, queryFields } from "./resources/query";
import { recordOperations, recordFields } from "./resources/record";
import { tableOperations, tableFields } from "./resources/table";
import { fieldOperations, fieldFields } from "./resources/field";
import { indexOperations, indexFields } from "./resources/index";
import {
    relationshipOperations,
    relationshipFields,
} from "./resources/relationship";
import { batchOperations, batchFields } from "./resources/batch";

/**
 * Connection pooling options for all operations
 */
const connectionPoolingOptions: INodeProperties[] = [
    {
        displayName: "Connection Pooling",
        name: "connectionPooling",
        type: "collection",
        placeholder: "Add Connection Pool Option",
        default: {},
        description:
            "Configure connection pooling settings for better performance",
        options: [
            {
                displayName: "Max Connections",
                name: "maxConnections",
                type: "number",
                typeOptions: {
                    minValue: 1,
                    maxValue: 50,
                },
                default: 10,
                description: "Maximum number of connections in the pool",
            },
            {
                displayName: "Min Connections",
                name: "minConnections",
                type: "number",
                typeOptions: {
                    minValue: 0,
                    maxValue: 20,
                },
                default: 2,
                description:
                    "Minimum number of connections to keep in the pool",
            },
            {
                displayName: "Acquire Timeout (ms)",
                name: "acquireTimeout",
                type: "number",
                typeOptions: {
                    minValue: 1000,
                    maxValue: 120000,
                },
                default: 30000,
                description:
                    "Maximum time to wait for a connection from the pool (milliseconds)",
            },
            {
                displayName: "Health Check Interval (ms)",
                name: "healthCheckInterval",
                type: "number",
                typeOptions: {
                    minValue: 10000,
                    maxValue: 300000,
                },
                default: 60000,
                description:
                    "Interval between health checks for pool connections (milliseconds)",
            },
            {
                displayName: "Max Idle Time (ms)",
                name: "maxIdleTime",
                type: "number",
                typeOptions: {
                    minValue: 30000,
                    maxValue: 1800000,
                },
                default: 300000,
                description:
                    "Maximum time a connection can remain idle before being closed (milliseconds)",
            },
            {
                displayName: "Retry Attempts",
                name: "retryAttempts",
                type: "number",
                typeOptions: {
                    minValue: 0,
                    maxValue: 10,
                },
                default: 3,
                description:
                    "Number of retry attempts for failed connection acquisitions",
            },
            {
                displayName: "Retry Delay (ms)",
                name: "retryDelay",
                type: "number",
                typeOptions: {
                    minValue: 100,
                    maxValue: 10000,
                },
                default: 1000,
                description: "Delay between retry attempts (milliseconds)",
            },
            {
                displayName: "Enable Connection Validation",
                name: "enableConnectionValidation",
                type: "boolean",
                default: true,
                description:
                    "Validate connections before use to ensure they are healthy",
            },
            {
                displayName: "Connection Validation Timeout (ms)",
                name: "connectionValidationTimeout",
                type: "number",
                typeOptions: {
                    minValue: 1000,
                    maxValue: 30000,
                },
                default: 5000,
                description:
                    "Timeout for connection validation queries (milliseconds)",
                displayOptions: {
                    show: {
                        enableConnectionValidation: [true],
                    },
                },
            },
        ],
    },
];

/**
 * Node properties array for SurrealDB node
 *
 * Following a modular architecture:
 * 1. Resource selector comes first
 * 2. Each resource module contributes its operations
 * 3. Each resource module contributes its fields
 */
export const nodeProperties: INodeProperties[] = [
    {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
            {
                name: "Record",
                value: "record",
                description: "Operations on individual records",
            },
            {
                name: "Table",
                value: "table",
                description: "Operations on entire tables",
            },
            {
                name: "Field",
                value: "field",
                description: "Operations on table fields",
            },
            {
                name: "Index",
                value: "index",
                description: "Operations on table indexes",
            },
            {
                name: "Relationship",
                value: "relationship",
                description: "Operations on record relationships (graph edges)",
            },
            {
                name: "Query",
                value: "query",
                description: "Execute arbitrary SurrealQL queries",
            },
            {
                name: "System",
                value: "system",
                description: "Database system-level checks",
            },
            {
                name: "Batch",
                value: "batch",
                description:
                    "High-performance batch operations with configurable processing",
            },
        ],
        default: "record",
    },
    // Include record operations from modular file
    ...recordOperations,
    // Include table operations from modular file
    ...tableOperations,
    // Include field operations from modular file
    ...fieldOperations,
    // Include index operations from modular file
    ...indexOperations,
    // Include relationship operations from modular file
    ...relationshipOperations,
    // Include query operations from modular file
    ...queryOperations,
    // Include system operations from modular file
    ...systemOperations,
    // Include batch operations from modular file
    ...batchOperations,

    // Include record fields from modular file
    ...recordFields,

    // Include table fields from modular file
    ...tableFields,

    // Include field fields from modular file
    ...fieldFields,

    // Include index fields from modular file
    ...indexFields,

    // Include relationship fields from modular file
    ...relationshipFields,

    // Include query fields from modular file
    ...queryFields,

    // Include system fields from modular file
    ...systemFields,

    // Include batch fields from modular file
    ...batchFields,

    // Include connection pooling options for all operations
    ...connectionPoolingOptions,
];
