import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from "n8n-workflow";
import type { Surreal } from "surrealdb";
import {
  prepareSurrealQuery,
  validateRequiredField,
  buildCredentialsObject,
} from "../../../GenericFunctions";
import { debugLog, addSuccessResult } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Delete Field" operation
 * This operation removes a field from a table
 */
export const deleteFieldOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    if (DEBUG) debugLog("deleteField", "Starting operation", itemIndex);
    // Get credentials
    const credentials = await executeFunctions.getCredentials("surrealDbApi");

    // Get parameters
    const table = executeFunctions.getNodeParameter(
      "table",
      itemIndex
    ) as string;
    const fieldName = executeFunctions.getNodeParameter(
      "fieldName",
      itemIndex
    ) as string;

    // Validate required fields
    validateRequiredField(executeFunctions, table, "Table", itemIndex);
    validateRequiredField(executeFunctions, fieldName, "Field Name", itemIndex);

    // Get options
    const options = executeFunctions.getNodeParameter(
      "options",
      itemIndex,
      {}
    ) as IDataObject;

    // Build the resolved credentials object using the utility function
    const resolvedCredentials = buildCredentialsObject(credentials, options);

    // Build the query to delete the field
    const query = `REMOVE FIELD ${fieldName} ON TABLE ${table};`;

    const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

    if (DEBUG) {
      // DEBUG: Log query
      debugLog("deleteField", "Prepared query", itemIndex, preparedQuery);
    }

    // Execute the query
    const result = await client.query(preparedQuery);

    if (DEBUG) {
      // DEBUG: Log raw result
      debugLog(
        "deleteField",
        "Raw query result",
        itemIndex,
        JSON.stringify(result)
      );
    }

    // Add the result using the standardized utility function
    addSuccessResult(
      returnData,
      {
        field: fieldName,
        table,
        message: `Field ${fieldName} has been deleted from table ${table}`,
      },
      itemIndex
    );

    return returnData;
  },
};
