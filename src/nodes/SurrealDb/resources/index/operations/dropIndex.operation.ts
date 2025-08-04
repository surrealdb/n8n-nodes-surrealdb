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
  checkQueryResult,
} from "../../../GenericFunctions";
import { debugLog, addSuccessResult } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Drop Index" operation
 * This operation removes an index from a table
 */
export const dropIndexOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    if (DEBUG) debugLog("dropIndex", "Starting operation", itemIndex);

    if (DEBUG) debugLog("dropIndex", "Processing item", itemIndex);

    // Get credentials
    const credentials = await executeFunctions.getCredentials("surrealDbApi");

    // Get parameters
    const table = executeFunctions.getNodeParameter(
      "table",
      itemIndex,
    ) as string;
    const indexName = executeFunctions.getNodeParameter(
      "indexName",
      itemIndex,
    ) as string;

    // Validate required fields
    validateRequiredField(executeFunctions, table, "Table", itemIndex);
    validateRequiredField(executeFunctions, indexName, "Index Name", itemIndex);

    // Get options
    const options = executeFunctions.getNodeParameter(
      "options",
      itemIndex,
      {},
    ) as IDataObject;

    // Build the query to drop the index
    let query = "";
    const ifExists = options.ifExists === true;

    // Try different syntax based on options
    if (options.useAlternativeSyntax === true) {
      query = `REMOVE INDEX ${ifExists ? "IF EXISTS " : ""
        }${indexName} ON ${table}`;
    } else {
      query = `REMOVE INDEX ${ifExists ? "IF EXISTS " : ""
        }${indexName} ON TABLE ${table}`;
    }

    // Add semicolon at the end
    query += ";";

    // Build credentials object
    const resolvedCredentials = buildCredentialsObject(credentials, options);

    const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

    if (DEBUG) {
      // DEBUG: Log query
      debugLog("dropIndex", "Prepared query", itemIndex, preparedQuery);
    }

    // Execute the query
    const result = await client.query(preparedQuery);

    if (DEBUG) {
      // DEBUG: Log raw result
      debugLog(
        "dropIndex",
        "Raw query result",
        itemIndex,
        JSON.stringify(result),
      );
    }

    // Check if the result contains an error
    const resultCheck = checkQueryResult(result, `Error dropping index`);

    if (resultCheck.success) {
      // No error, operation succeeded - return result using the standard utility function
      if (DEBUG) debugLog("dropIndex", "Success for item", itemIndex);
      addSuccessResult(
        returnData,
        {
          index: indexName,
          table,
          message: `Index ${indexName} has been dropped from table ${table}`,
        },
        itemIndex,
      );
    } else {
      // If there's an error in the result, throw it to be handled at the handler level
      throw new NodeOperationError(
        executeFunctions.getNode(),
        resultCheck.errorMessage || "Unknown error",
        { itemIndex },
      );
    }

    if (DEBUG)
      debugLog(
        "dropIndex",
        `Completed, returning ${returnData.length} items`,
        itemIndex,
      );
    return returnData;
  },
};
