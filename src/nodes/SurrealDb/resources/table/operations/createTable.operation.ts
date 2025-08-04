import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData

} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import {
  prepareSurrealQuery,
  validateRequiredField,
  cleanTableName,
  buildCredentialsObject, checkQueryResult,
} from "../../../GenericFunctions";
import { debugLog } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from '../../../debug';

/**
 * Implementation of the "Create Table" operation
 * This operation creates a new table in the database
 */
export const createTableOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    // Get parameters
    let table = executeFunctions.getNodeParameter("table", itemIndex) as string;
    validateRequiredField(executeFunctions, table, "Table", itemIndex);

    // Clean and standardize the table name
    table = cleanTableName(table);

    // Get options
    const options = executeFunctions.getNodeParameter(
      "options",
      itemIndex,
      {},
    ) as IDataObject;

    // Get schema if provided and convert from string if needed
    let schema = null;
    if (options.schema) {
      if (typeof options.schema === "string") {
        try {
          schema = JSON.parse(options.schema);
        } catch (error) {
          throw new Error(`Invalid schema JSON: ${error.message}`);
        }
      } else if (typeof options.schema === "object") {
        schema = options.schema;
      }
    }

    // Get credentials
    const credentials = await executeFunctions.getCredentials("surrealDbApi");

    // Build the resolved credentials object
    const resolvedCredentials = buildCredentialsObject(credentials, options);

    // Get table type and schema mode options
    const tableType = (options.tableType as string) || "NORMAL";
    const schemaMode = (options.schemaMode as string) || "SCHEMALESS";

    // Build the query to create a table
    let query: string;

    // Start with the basic DEFINE TABLE statement with the specified type
    query = `DEFINE TABLE ${table} TYPE ${tableType} ${schemaMode}`;

    // Add schema fields if schema is provided and mode is SCHEMAFULL
    if (schemaMode === "SCHEMAFULL" && schema) {
      // Prepare the schema definition query
      // For each field in the schema, define its type
      if (schema.fields && Object.keys(schema.fields).length > 0) {
        for (const [fieldName, fieldType] of Object.entries(schema.fields)) {
          query += `; DEFINE FIELD ${fieldName} ON TABLE ${table} TYPE ${fieldType}`;
        }
      }
    }

    const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

    if (DEBUG) {
      debugLog("createTable", "Query", itemIndex, preparedQuery);
    }

    // Execute the query


    const result = await client.query(preparedQuery);



    // Check for query errors
    const queryCheck = checkQueryResult(result, "Query failed");
    if (!queryCheck.success) {
      if (executeFunctions.continueOnFail()) {
        returnData.push({
          json: {
            error: queryCheck.errorMessage,
          },
          pairedItem: { item: itemIndex },
        });
      } else {
        throw new NodeOperationError(executeFunctions.getNode(), queryCheck.errorMessage || "Unknown error", {
          itemIndex,
        });
      }
    }

    if (DEBUG) {
      debugLog(
        "createTable",
        "Raw query result",
        itemIndex,
        JSON.stringify(result),
      );
    }

    // For CREATE TABLE operations, SurrealDB typically returns [null]
    // We need to ensure we always return a valid json property for n8n
    returnData.push({
      json: {}, // Empty object is the minimal valid json property
      pairedItem: { item: itemIndex },
    });

    return returnData;
  },
};
