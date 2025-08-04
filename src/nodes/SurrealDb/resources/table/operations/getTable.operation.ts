import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import {
  prepareSurrealQuery,
  validateRequiredField,
  buildCredentialsObject,
} from "../../../GenericFunctions";
import { debugLog } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Get Table" operation
 * This operation retrieves the definition details of a table
 */
export const getTableOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    try {
      // Get credentials
      const credentials = await executeFunctions.getCredentials("surrealDbApi");

      // Get parameters
      const table = executeFunctions.getNodeParameter(
        "table",
        itemIndex,
      ) as string;

      // Validate required fields
      validateRequiredField(executeFunctions, table, "Table", itemIndex);

      // Get options
      const options = executeFunctions.getNodeParameter(
        "options",
        itemIndex,
        {},
      ) as IDataObject;

      // Build the resolved credentials object
      const resolvedCredentials = buildCredentialsObject(credentials, options);

      // Build the query to get table definition
      const query = `INFO FOR TABLE ${table};`;

      const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

      if (DEBUG) {
        // DEBUG: Log query
        debugLog("getTable", "Query", itemIndex, preparedQuery);
      }

      // Execute the query
      const result = await client.query(preparedQuery);

      if (DEBUG) {
        // DEBUG: Log raw result
        debugLog(
          "getTable",
          "Raw query result",
          itemIndex,
          JSON.stringify(result),
        );
      }

      // Process the result
      if (Array.isArray(result) && result.length > 0) {
        const tableInfo = result[0];

        // Return the table information directly
        returnData.push({
          json: tableInfo as IDataObject,
          pairedItem: { item: itemIndex },
        });
      } else {
        throw new Error(`Unable to retrieve information for table ${table}`);
      }
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        returnData.push({
          json: {
            error: error.message,
          },
          pairedItem: { item: itemIndex },
        });
      } else {
        throw new NodeOperationError(
          executeFunctions.getNode(),
          `Error getting table definition: ${error.message}`,
          { itemIndex },
        );
      }
    }

    return returnData;
  },
};
