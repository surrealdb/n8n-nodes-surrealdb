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
  buildCredentialsObject,
  checkQueryResult,
} from "../../../GenericFunctions";
import { debugLog, addSuccessResult } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from '../../../debug';

/**
 * Implementation of the "Create Index" operation
 * This operation creates a new index on a table
 */
export const createIndexOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    if (DEBUG) debugLog("createIndex", "Starting operation", itemIndex);

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
    const indexType = executeFunctions.getNodeParameter(
      "indexType",
      itemIndex,
    ) as string;
    const indexFields = executeFunctions.getNodeParameter(
      "indexFields",
      itemIndex,
    ) as string;

    // Validate required fields
    validateRequiredField(executeFunctions, table, "Table", itemIndex);
    validateRequiredField(executeFunctions, indexName, "Index Name", itemIndex);
    validateRequiredField(
      executeFunctions,
      indexFields,
      "Index Fields",
      itemIndex,
    );

    // Process fields
    const fieldsList = indexFields
      .split(",")
      .map((field) => field.trim())
      .filter((field) => field);

    // Get options
    const options = executeFunctions.getNodeParameter(
      "options",
      itemIndex,
      {},
    ) as IDataObject;

    // Get credentials using utility function
    const resolvedCredentials = buildCredentialsObject(credentials, options);

    // Build the query to create an index
    let query = "";

    // If using IF NOT EXISTS
    const ifNotExists = options.ifNotExists === true;

    // Build the base query according to index type
    if (indexType === "standard") {
      query = `DEFINE INDEX ${ifNotExists ? "IF NOT EXISTS " : ""
        }${indexName} ON TABLE ${table} COLUMNS ${fieldsList.join(", ")}`;

      // Add UNIQUE if specified
      if (options.isUnique === true) {
        query += " UNIQUE";
      }
    } else if (indexType === "search") {
      query = `DEFINE ANALYZER ${ifNotExists ? "IF NOT EXISTS " : ""
        }${indexName} TOKENIZERS blank,class,punct FILTERS lowercase,snowball(english) TOKENIZER blank;`;
      query += `\nDEFINE INDEX ${ifNotExists ? "IF NOT EXISTS " : ""
        }${indexName} ON TABLE ${table} COLUMNS ${fieldsList.join(
          ", ",
        )} SEARCH ANALYZER ${indexName}`;
    } else if (indexType === "mtree") {
      query = `DEFINE INDEX ${ifNotExists ? "IF NOT EXISTS " : ""
        }${indexName} ON TABLE ${table} COLUMNS ${fieldsList.join(", ")} VECTOR`;

      // Add vector data type if specified
      const vectorType = options.vectorType as string;
      if (vectorType) {
        query += ` TYPE ${vectorType}`;
      }

      // Add distance function
      const distanceFunction = executeFunctions.getNodeParameter(
        "distanceFunction",
        itemIndex,
        "euclidean",
      ) as string;
      query += ` DIST ${distanceFunction.toUpperCase()}`;
    }

    // Add CONCURRENTLY clause if specified
    if (options.concurrently === true) {
      query += " CONCURRENTLY";
    }

    // End the query
    query += ";";

    // Prepare query for the specific authentication type
    const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

    if (DEBUG) {
      // DEBUG: Log query
      debugLog("createIndex", "Prepared query", itemIndex, preparedQuery);
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
        "createIndex",
        "Raw query result",
        itemIndex,
        JSON.stringify(result),
      );
    }

    // Check if the result contains an error
    const resultCheck = checkQueryResult(result, `Error creating index`);

    if (resultCheck.success) {
      // No error, operation succeeded - return minimal valid response for n8n
      if (DEBUG) debugLog("createIndex", "Success for item", itemIndex);
      // For CREATE INDEX operations, SurrealDB typically returns [null]
      // We need to ensure we always return a valid json property for n8n
      addSuccessResult(returnData, { success: true }, itemIndex); // Empty object is the minimal valid json property
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
        "createIndex",
        `Completed, returning ${returnData.length} items`,
        itemIndex,
      );
    return returnData;
  },
};
