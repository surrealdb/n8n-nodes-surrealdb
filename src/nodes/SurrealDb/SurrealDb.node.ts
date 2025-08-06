import type {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    ILoadOptionsFunctions,
} from "n8n-workflow";

import { DEBUG } from "./debug";

import { validateAndResolveSurrealCredentials } from "./GenericFunctions";
import { nodeProperties } from "./SurrealDbProperties";
import { validatePoolConfig } from "./utilities";

// Import connection pooling
import {
    getGlobalConnectionPool,
    closeGlobalConnectionPool,
    type IConnectionPoolConfig,
} from "./ConnectionPool";

// Import the new resource handlers
import { handleSystemOperations } from "./resources/system";
import { handleQueryOperations } from "./resources/query";
import { handleRecordOperations } from "./resources/record";
import { handleTableOperations } from "./resources/table";
import { handleFieldOperations } from "./resources/field";
import { handleIndexOperations } from "./resources/index";
import { handleRelationshipOperations } from "./resources/relationship";
import { handleBatchOperations } from "./resources/batch";

// Import the resource operations for building the operation name map
import { systemOperations } from "./resources/system";
import { queryOperations } from "./resources/query";
import { recordOperations } from "./resources/record";
import { tableOperations } from "./resources/table";
import { fieldOperations } from "./resources/field";
import { indexOperations } from "./resources/index";
import { relationshipOperations } from "./resources/relationship";
import { batchOperations } from "./resources/batch";

// Define a simple flat map from operation values to display names
const operationDisplayNames = {
    createRecord: "Create Record",
    getRecord: "Get Record",
    updateRecord: "Update Record",
    mergeRecord: "Merge Record",
    deleteRecord: "Delete Record",
    upsertRecord: "Upsert Record",
    listTables: "List Tables",
    getTable: "Get Table",
    createTable: "Create Table",
    deleteTable: "Delete Table",
    getAllRecords: "Get All Records",
    createMany: "Create Many Records",
    getMany: "Get Many Records",
    updateAllRecords: "Update All Records",
    deleteAllRecords: "Delete All Records",
    mergeAllRecords: "Merge All Records",
    listFields: "List Fields",
    createField: "Create Field",
    deleteField: "Delete Field",
    listIndexes: "List Indexes",
    createIndex: "Create Index",
    dropIndex: "Drop Index",
    describeIndex: "Describe Index",
    rebuildIndex: "Rebuild Index",
    createRelationship: "Create Relationship",
    deleteRelationship: "Delete Relationship",
    queryRelationships: "Query Relationships",
    executeQuery: "Execute Query",
    buildSelectQuery: "Build Select Query",
    healthCheck: "Health Check",
    version: "Get Version",
    poolStats: "Get Pool Statistics",
    batchCreate: "Batch Create",
    batchUpdate: "Batch Update",
    batchDelete: "Batch Delete",
    batchUpsert: "Batch Upsert",
};

export class SurrealDb implements INodeType {
    // Add the operation name map as a property of the node class
    operationNameMap: { [key: string]: { [key: string]: string } };

    constructor() {
        // Initialize the operation name map
        this.operationNameMap = this.buildOperationNameMap();
    }

    description: INodeTypeDescription = {
        displayName: "SurrealDB",
        name: "surrealDb",
        icon: "file:surrealdb.svg",
        group: ["input"],
        version: 1,
        description: "Interaction with a SurrealDB database",
        defaults: {
            name: "SurrealDB",
        },
        inputs: ["main"],
        outputs: ["main"],
        usableAsTool: true,
        // Use the operation parameter to look up the display name in the flat map
        subtitle:
            "={{(" +
            JSON.stringify(operationDisplayNames) +
            ')[$parameter["operation"]]}}',
        credentials: [
            {
                name: "surrealDbApi",
                required: true,
            },
        ],
        properties: nodeProperties,
    };

    // Helper method to build the operation name map
    buildOperationNameMap(): { [key: string]: { [key: string]: string } } {
        const operationMap: { [key: string]: { [key: string]: string } } = {};

        // Add record operations
        operationMap.record = {};
        recordOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.record[option.value as string] =
                    option.name as string;
            }
        });

        // Add table operations
        operationMap.table = {};
        tableOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.table[option.value as string] =
                    option.name as string;
            }
        });

        // Add field operations
        operationMap.field = {};
        fieldOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.field[option.value as string] =
                    option.name as string;
            }
        });

        // Add index operations
        operationMap.index = {};
        indexOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.index[option.value as string] =
                    option.name as string;
            }
        });

        // Add relationship operations
        operationMap.relationship = {};
        relationshipOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.relationship[option.value as string] =
                    option.name as string;
            }
        });

        // Add query operations
        operationMap.query = {};
        queryOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.query[option.value as string] =
                    option.name as string;
            }
        });

        // Add system operations
        operationMap.system = {};
        systemOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.system[option.value as string] =
                    option.name as string;
            }
        });

        // Add batch operations
        operationMap.batch = {};
        batchOperations[0].options?.forEach(option => {
            if ("value" in option && "name" in option) {
                operationMap.batch[option.value as string] =
                    option.name as string;
            }
        });

        return operationMap;
    }

    // Add methods for the node
    methods = {
        loadOptions: {
            // Method to get the operation name for the subtitle
            async getOperationName(this: ILoadOptionsFunctions) {
                try {
                    const operation = this.getNodeParameter(
                        "operation",
                        "",
                    ) as string;

                    // Fallback to the operation value if not found in the map
                    return [{ name: operation, value: operation }];
                } catch {
                    return [
                        {
                            name: "Error getting operation name",
                            value: "error",
                        },
                    ];
                }
            },
        },
    };

    // Method to get the operation name for a given resource and operation
    getOperationName(resource: string, operation: string): string {
        if (
            this.operationNameMap &&
            this.operationNameMap[resource] &&
            this.operationNameMap[resource][operation]
        ) {
            return this.operationNameMap[resource][operation];
        }
        return operation;
    }

    // Cleanup method to close connection pool when node is deactivated
    async onNodeDeactivate(): Promise<void> {
        try {
            await closeGlobalConnectionPool();
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log(
                    "[SurrealDB Node] Connection pool closed during node deactivation",
                );
            }
        } catch (error) {
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.error(
                    "[SurrealDB Node] Error closing connection pool:",
                    error,
                );
            }
        }
    }

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const credentials = await this.getCredentials("surrealDbApi");

        // Get options for the current operation to retrieve potential namespace/database overrides
        const options = this.getNodeParameter("options", 0, {}) as IDataObject;
        const nodeNamespace = (options.namespace as string)?.trim() || "";
        const nodeDatabase = (options.database as string)?.trim() || "";

        // Get connection pooling options
        const poolConfig: Partial<IConnectionPoolConfig> = {};
        const connectionPoolingOptions =
            (options.connectionPooling as IDataObject) || {};

        if (connectionPoolingOptions.maxConnections !== undefined) {
            poolConfig.maxConnections = Number(
                connectionPoolingOptions.maxConnections,
            );
        }
        if (connectionPoolingOptions.minConnections !== undefined) {
            poolConfig.minConnections = Number(
                connectionPoolingOptions.minConnections,
            );
        }
        if (connectionPoolingOptions.acquireTimeout !== undefined) {
            poolConfig.acquireTimeout = Number(
                connectionPoolingOptions.acquireTimeout,
            );
        }
        if (connectionPoolingOptions.healthCheckInterval !== undefined) {
            poolConfig.healthCheckInterval = Number(
                connectionPoolingOptions.healthCheckInterval,
            );
        }
        if (connectionPoolingOptions.maxIdleTime !== undefined) {
            poolConfig.maxIdleTime = Number(
                connectionPoolingOptions.maxIdleTime,
            );
        }
        if (connectionPoolingOptions.retryAttempts !== undefined) {
            poolConfig.retryAttempts = Number(
                connectionPoolingOptions.retryAttempts,
            );
        }
        if (connectionPoolingOptions.retryDelay !== undefined) {
            poolConfig.retryDelay = Number(connectionPoolingOptions.retryDelay);
        }
        if (connectionPoolingOptions.enableConnectionValidation !== undefined) {
            poolConfig.enableConnectionValidation = Boolean(
                connectionPoolingOptions.enableConnectionValidation,
            );
        }
        if (
            connectionPoolingOptions.connectionValidationTimeout !== undefined
        ) {
            poolConfig.connectionValidationTimeout = Number(
                connectionPoolingOptions.connectionValidationTimeout,
            );
        }

        // Validate connection pool configuration
        const validationResult = validatePoolConfig(poolConfig);
        if (!validationResult.isValid) {
            throw new Error(
                `Invalid connection pool configuration: ${validationResult.errors.join(", ")}`,
            );
        }

        // Resolve credentials, passing in overrides
        const resolvedCredentials = validateAndResolveSurrealCredentials(
            this,
            credentials,
            nodeNamespace, // Pass the renamed variable
            nodeDatabase, // Pass the renamed variable
        );

        if (DEBUG) {
            // eslint-disable-next-line no-console
            const sanitizedCredentials = {
                ...resolvedCredentials,
                password: resolvedCredentials.password
                    ? "[REDACTED]"
                    : undefined,
            };
            console.log(
                "DEBUG - Resolved Credentials:",
                JSON.stringify(sanitizedCredentials),
            );
        }

        // Get connection from pool instead of creating new connection
        const connectionPool = getGlobalConnectionPool(poolConfig);
        const client = await connectionPool.getConnection(resolvedCredentials);

        let returnData: INodeExecutionData[] = [];

        const items = this.getInputData();
        const resource = this.getNodeParameter("resource", 0) as string;
        const operation = this.getNodeParameter("operation", 0) as string;

        try {
            // Use our resource handlers for all resources
            if (resource === "system") {
                returnData = await handleSystemOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
            // Resource: Record
            else if (resource === "record") {
                returnData = await handleRecordOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
            // Resource: Table
            else if (resource === "table") {
                returnData = await handleTableOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
            // Resource: Query
            else if (resource === "query") {
                returnData = await handleQueryOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
            // Resource: Field
            else if (resource === "field") {
                returnData = await handleFieldOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
            // Resource: Index
            else if (resource === "index") {
                returnData = await handleIndexOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
            // Resource: Relationship
            else if (resource === "relationship") {
                returnData = await handleRelationshipOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
            // Resource: Batch
            else if (resource === "batch") {
                returnData = await handleBatchOperations(
                    operation,
                    client,
                    items,
                    this,
                );
            }
        } finally {
            // Release connection back to pool instead of closing it
            connectionPool.releaseConnection(resolvedCredentials, client);
        }

        return [returnData];
    }
}
