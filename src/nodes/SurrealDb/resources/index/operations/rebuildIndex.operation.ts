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
  buildCredentialsObject, checkQueryResult,
} from "../../../GenericFunctions";
import { debugLog } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from '../../../debug';

/**
 * Implementation of the "Rebuild Index" operation
 * This operation rebuilds an existing index on a table
 */
export const rebuildIndexOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

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

    // Build the resolved credentials object using utility function
    const resolvedCredentials = buildCredentialsObject(credentials, options);

    // Build the query to rebuild the index
    let query = "REBUILD INDEX";

    // Add IF EXISTS clause if specified
    if (options.ifExists === true) {
      query += " IF EXISTS";
    }

    // Add index name and table
    query += ` ${indexName} ON TABLE ${table};`;

    const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

    if (DEBUG) {
      // DEBUG: Log query
      debugLog("rebuildIndex", "Query", itemIndex, preparedQuery);
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
      // DEBUG: Log raw result
      debugLog(
        "rebuildIndex",
        "Raw query result",
        itemIndex,
        JSON.stringify(result),
      );
    }

    // Simply return the raw SurrealDB response without any transformation
    returnData.push({
      json: (Array.isArray(result) && result.length > 0
        ? result[0]
        : result) as IDataObject,
      pairedItem: { item: itemIndex },
    });

    return returnData;
  },
};
