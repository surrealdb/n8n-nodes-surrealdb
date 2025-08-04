import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import {
  formatArrayResult,
  debugLog,
  createErrorResult,
} from "../../../utilities";
import {
  validateRequiredField,
  validateAndParseData,
  cleanTableName,
  buildUpdateQuery,
  prepareSurrealQuery,
  buildCredentialsObject,
} from "../../../GenericFunctions";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from '../../../debug';

/**
 * Update All Records operation handler for Table resource
 * This operation replaces the content of all records in a table with the provided data
 */
export const updateAllRecordsOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    try {
      if (DEBUG) debugLog("updateAllRecords", "Starting operation", itemIndex);

      // Get credentials
      const credentials = await executeFunctions.getCredentials("surrealDbApi");

      // Get parameters for the specific item
      const tableInput = executeFunctions.getNodeParameter(
        "table",
        itemIndex,
      ) as string;
      validateRequiredField(executeFunctions, tableInput, "Table", itemIndex);
      const table = cleanTableName(tableInput);

      // Get data to update the records with
      const dataInput = executeFunctions.getNodeParameter("data", itemIndex);
      const data = validateAndParseData(
        executeFunctions,
        dataInput,
        "Data",
        itemIndex,
      );

      // Validate data is an object
      if (typeof data !== "object" || Array.isArray(data) || data === null) {
        throw new NodeOperationError(
          executeFunctions.getNode(),
          "Data must be a JSON object with fields to update",
          { itemIndex },
        );
      }

      // Get options
      const options = executeFunctions.getNodeParameter(
        "options",
        itemIndex,
        {},
      ) as IDataObject;

      // Get where clause if provided
      const where = (options.where as string) || "";

      // Use helper function to build the update query
      const query = buildUpdateQuery(table, where);

      // Build credentials object
      const resolvedCredentials = buildCredentialsObject(credentials, options);

      if (DEBUG) {
        debugLog("updateAllRecords", "Original query", itemIndex, query);
        debugLog("updateAllRecords", "Data for update", itemIndex, data);
        debugLog(
          "updateAllRecords",
          "Authentication",
          itemIndex,
          resolvedCredentials.authentication,
        );
        debugLog(
          "updateAllRecords",
          "Namespace",
          itemIndex,
          resolvedCredentials.namespace,
        );
        debugLog(
          "updateAllRecords",
          "Database",
          itemIndex,
          resolvedCredentials.database,
        );
      }

      // Prepare the query based on authentication type
      const finalQuery = prepareSurrealQuery(query, resolvedCredentials);

      if (DEBUG) {
        debugLog("updateAllRecords", "Final query", itemIndex, finalQuery);
      }

      // Execute the query
      const result = await client.query<[unknown[]]>(finalQuery, { data });

      if (DEBUG) {
        debugLog(
          "updateAllRecords",
          "Raw query result",
          itemIndex,
          JSON.stringify(result),
        );
      }

      // Find the first non-null array in the result
      const recordsArray = Array.isArray(result)
        ? result.find((item) => Array.isArray(item))
        : null;

      const returnData: INodeExecutionData[] = [];

      if (recordsArray) {
        // Format the results
        const formattedResults = formatArrayResult(recordsArray);

        // Add each formatted result to returnData with pairedItem
        for (const formattedResult of formattedResults) {
          returnData.push({
            ...formattedResult,
            pairedItem: { item: itemIndex },
          });
        }
      }

      if (DEBUG)
        debugLog(
          "updateAllRecords",
          `Completed, returning ${returnData.length} items`,
          itemIndex,
        );
      return returnData;
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        if (DEBUG)
          debugLog(
            "updateAllRecords",
            "Error with continueOnFail enabled",
            itemIndex,
            error.message,
          );
        return [createErrorResult(error, itemIndex)];
      }
      if (DEBUG)
        debugLog(
          "updateAllRecords",
          "Error, stopping execution",
          itemIndex,
          error.message,
        );
      throw error;
    }
  },
};
