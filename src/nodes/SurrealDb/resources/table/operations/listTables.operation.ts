import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData

} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import {
  prepareSurrealQuery,
  buildCredentialsObject, checkQueryResult,
} from "../../../GenericFunctions";
import { debugLog, addErrorResult } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from '../../../debug';

/**
 * Implementation of the "List Tables" operation
 * This operation lists all available tables in the database
 */
export const listTablesOperation: IOperationHandler = {
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

      // Get options
      const options = executeFunctions.getNodeParameter(
        "options",
        itemIndex,
        {},
      ) as IDataObject;

      // Build the resolved credentials object using utility function
      const resolvedCredentials = buildCredentialsObject(credentials, options);

      // Build the query to list all tables
      const query = "INFO FOR DB;";
      const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

      if (DEBUG) {
        debugLog("listTables", "Query", itemIndex, preparedQuery);
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
          "listTables",
          "Raw query result",
          itemIndex,
          JSON.stringify(result),
        );
      }

      // Process the result based on the observed structure in debug output
      if (Array.isArray(result) && result.length > 0 && result[0]) {
        const dbInfo = result[0] as Record<string, unknown>;

        // Check for tables property as observed in the debug output
        if (dbInfo.tables && typeof dbInfo.tables === "object") {
          // Get table names (the keys of the tables object)
          const tableNames = Object.keys(
            dbInfo.tables as Record<string, unknown>,
          );

          if (tableNames.length > 0) {
            // Add each table as a separate item
            for (const tableName of tableNames) {
              // Get the table definition string from the value
              const tableDefinition = (
                dbInfo.tables as Record<string, unknown>
              )[tableName];

              // Parse the table type from the definition string
              // Format is typically "DEFINE TABLE [name] TYPE [type] ..."
              let tableType = "NORMAL";
              if (typeof tableDefinition === "string") {
                const typeMatch = tableDefinition.match(/TYPE\s+(\w+)/i);
                if (typeMatch && typeMatch[1]) {
                  tableType = typeMatch[1];
                }
              }

              returnData.push({
                json: {
                  name: tableName,
                  type: tableType,
                },
                pairedItem: { item: itemIndex },
              });
            }
          } else {
            // No tables found
            returnData.push({
              json: { message: "No tables found in the database" },
              pairedItem: { item: itemIndex },
            });
          }
        } else {
          // No tables property in the result
          returnData.push({
            json: { message: "No tables found in the database structure" },
            pairedItem: { item: itemIndex },
          });
        }
      } else {
        // Unexpected result structure
        returnData.push({
          json: { message: "Unexpected database response structure" },
          pairedItem: { item: itemIndex },
        });
      }
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        addErrorResult(returnData, error, itemIndex);
      } else {
        throw error;
      }
    }

    return returnData;
  },
};
