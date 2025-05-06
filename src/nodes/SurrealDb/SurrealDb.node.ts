import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  ILoadOptionsFunctions,
} from "n8n-workflow";

// Set to true to enable debug logging, false to disable
const DEBUG = false;

import {
  connectSurrealClient,
  validateAndResolveSurrealCredentials,
} from "./GenericFunctions";
import { nodeProperties } from "./SurrealDbProperties";

// Import the new resource handlers
import { handleSystemOperations } from "./resources/system";
import { handleQueryOperations } from "./resources/query";
import { handleRecordOperations } from "./resources/record";
import { handleTableOperations } from "./resources/table";
import { handleFieldOperations } from "./resources/field";
import { handleIndexOperations } from "./resources/index";
import { handleRelationshipOperations } from "./resources/relationship";

// Import the resource operations for building the operation name map
import { systemOperations } from "./resources/system";
import { queryOperations } from "./resources/query";
import { recordOperations } from "./resources/record";
import { tableOperations } from "./resources/table";
import { fieldOperations } from "./resources/field";
import { indexOperations } from "./resources/index";
import { relationshipOperations } from "./resources/relationship";

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
  healthCheck: "Health Check",
  version: "Get Version",
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
    inputs: ["main"] as any,
    outputs: ["main"] as any,
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
    recordOperations[0].options?.forEach((option: any) => {
      operationMap.record[option.value] = option.name;
    });

    // Add table operations
    operationMap.table = {};
    tableOperations[0].options?.forEach((option: any) => {
      operationMap.table[option.value] = option.name;
    });

    // Add field operations
    operationMap.field = {};
    fieldOperations[0].options?.forEach((option: any) => {
      operationMap.field[option.value] = option.name;
    });

    // Add index operations
    operationMap.index = {};
    indexOperations[0].options?.forEach((option: any) => {
      operationMap.index[option.value] = option.name;
    });

    // Add relationship operations
    operationMap.relationship = {};
    relationshipOperations[0].options?.forEach((option: any) => {
      operationMap.relationship[option.value] = option.name;
    });

    // Add query operations
    operationMap.query = {};
    queryOperations[0].options?.forEach((option: any) => {
      operationMap.query[option.value] = option.name;
    });

    // Add system operations
    operationMap.system = {};
    systemOperations[0].options?.forEach((option: any) => {
      operationMap.system[option.value] = option.name;
    });

    return operationMap;
  }

  // Add methods for the node
  methods = {
    loadOptions: {
      // Method to get the operation name for the subtitle
      getOperationName(this: ILoadOptionsFunctions) {
        try {
          const resource = this.getNodeParameter("resource", "") as string;
          const operation = this.getNodeParameter("operation", "") as string;

          // Get the node instance
          const node = this.getNode() as any;

          // Return the operation name from the map
          if (
            node &&
            node.operationNameMap &&
            node.operationNameMap[resource] &&
            node.operationNameMap[resource][operation]
          ) {
            return node.operationNameMap[resource][operation];
          }

          // Fallback to the operation value if not found in the map
          return operation;
        } catch (error) {
          return "Error getting operation name";
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

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials("surrealDbApi");

    // Get options for the current operation to retrieve potential namespace/database overrides
    const options = this.getNodeParameter("options", 0, {}) as IDataObject;
    const nodeNamespace = (options.namespace as string)?.trim() || "";
    const nodeDatabase = (options.database as string)?.trim() || "";

    // Resolve credentials, passing in overrides
    const resolvedCredentials = validateAndResolveSurrealCredentials(
      this,
      credentials,
      nodeNamespace, // Pass the renamed variable
      nodeDatabase // Pass the renamed variable
    );

    if (DEBUG) {
      console.log(
        "DEBUG - Resolved Credentials:",
        JSON.stringify(resolvedCredentials)
      );
    }

    const client = await connectSurrealClient(resolvedCredentials);

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
          this
        );
      }
      // Resource: Record
      else if (resource === "record") {
        returnData = await handleRecordOperations(
          operation,
          client,
          items,
          this
        );
      }
      // Resource: Table
      else if (resource === "table") {
        returnData = await handleTableOperations(
          operation,
          client,
          items,
          this
        );
      }
      // Resource: Query
      else if (resource === "query") {
        returnData = await handleQueryOperations(
          operation,
          client,
          items,
          this
        );
      }
      // Resource: Field
      else if (resource === "field") {
        returnData = await handleFieldOperations(
          operation,
          client,
          items,
          this
        );
      }
      // Resource: Index
      else if (resource === "index") {
        returnData = await handleIndexOperations(
          operation,
          client,
          items,
          this
        );
      }
      // Resource: Relationship
      else if (resource === "relationship") {
        returnData = await handleRelationshipOperations(
          operation,
          client,
          items,
          this
        );
      }
    } finally {
      // Always close the connection
      await client.close();
    }

    return [returnData];
  }
}
