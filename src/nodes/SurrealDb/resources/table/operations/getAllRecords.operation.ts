import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from "n8n-workflow";
import type { Surreal } from "surrealdb";
import {
  formatArrayResult,
  debugLog,
  createErrorResult,
} from "../../../utilities";
import {
  prepareSurrealQuery,
  validateRequiredField,
  cleanTableName,
  buildSelectQuery,
  buildCredentialsObject,
} from "../../../GenericFunctions";
import type { IOperationHandler } from "../../../types/operation.types";

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Get All Records" operation
 */
export const getAllRecordsOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number
  ): Promise<INodeExecutionData[]> {
    try {
      if (DEBUG) debugLog("getAllRecords", "Starting operation", itemIndex);

      // Get credentials
      const credentials = await executeFunctions.getCredentials("surrealDbApi");

      // Get parameters for the specific item
      const tableInput = executeFunctions.getNodeParameter(
        "table",
        itemIndex
      ) as string;
      validateRequiredField(executeFunctions, tableInput, "Table", itemIndex);
      const table = cleanTableName(tableInput);

      // Get options
      const options = executeFunctions.getNodeParameter(
        "options",
        itemIndex,
        {}
      ) as IDataObject;
      const pagination = {
        limit: options.limit as number,
        start: (options.start as number) || 0,
      };

      // Use helper function to build the query
      const { query: baseQuery, params: queryParams } = buildSelectQuery(
        table,
        pagination
      );

      // Build credentials object
      const resolvedCredentials = buildCredentialsObject(credentials, options);

      if (DEBUG) {
        // DEBUG: Log query and credentials
        debugLog("getAllRecords", "Original query", itemIndex, baseQuery);
        debugLog(
          "getAllRecords",
          "Authentication type",
          itemIndex,
          resolvedCredentials.authentication
        );
        debugLog(
          "getAllRecords",
          "Namespace",
          itemIndex,
          resolvedCredentials.namespace
        );
        debugLog(
          "getAllRecords",
          "Database",
          itemIndex,
          resolvedCredentials.database
        );
        debugLog("getAllRecords", "Query parameters", itemIndex, queryParams);
      }

      // Prepare the query based on authentication type
      const query = prepareSurrealQuery(baseQuery, resolvedCredentials);

      if (DEBUG) {
        // DEBUG: Log modified query
        debugLog("getAllRecords", "Modified query", itemIndex, query);
      }

      // Execute the query
      // Provide generic type argument for expected result structure: [any[]] - An array containing the array of records
      const result = await client.query<[any[]]>(query, queryParams);

      if (DEBUG) {
        // DEBUG: Log raw result
        debugLog(
          "getAllRecords",
          "Raw query result",
          itemIndex,
          JSON.stringify(result)
        );
      }

      // Find the first non-null array in the result
      const recordsArray = Array.isArray(result)
        ? result.find((item) => Array.isArray(item))
        : null;

      const returnData: INodeExecutionData[] = [];

      if (recordsArray && Array.isArray(recordsArray) && recordsArray.length > 0) {
        // We have actual records, format and push them
        const formattedResults = formatArrayResult(recordsArray);
        for (const formattedResult of formattedResults) {
          returnData.push({
            ...formattedResult, // formattedResult is { json: row_data }
            pairedItem: { item: itemIndex },
          });
        }
      } else {
        // No records found (e.g., table is empty, or query result structure was unexpected but not an error)
        // Output a single item indicating an empty list of records.
        returnData.push({
          json: { records: [] }, // Ensure json is an object containing the empty list
          pairedItem: { item: itemIndex },
        });
      }

      if (DEBUG)
        debugLog(
          "getAllRecords",
          `Completed, returning ${returnData.length} items`,
          itemIndex
        );
      return returnData;
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        if (DEBUG)
          debugLog(
            "getAllRecords",
            "Error with continueOnFail enabled",
            itemIndex,
            error.message
          );
        return [createErrorResult(error, itemIndex)];
      }
      if (DEBUG)
        debugLog(
          "getAllRecords",
          "Error, stopping execution",
          itemIndex,
          error.message
        );
      throw error;
    }
  },
};
