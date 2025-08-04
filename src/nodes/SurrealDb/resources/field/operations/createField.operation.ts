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
  cleanTableName,
  buildCredentialsObject,
  checkQueryResult,
} from "../../../GenericFunctions";
import { debugLog, addSuccessResult } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from '../../../debug';

/**
 * Implementation of the "Create Field" operation
 * This operation creates a new field on a table
 */
export const createFieldOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    if (DEBUG) debugLog("createField", "Starting operation", itemIndex);

    // Get credentials
    const credentials = await executeFunctions.getCredentials("surrealDbApi");

    // Get parameters
    const tableInput = executeFunctions.getNodeParameter(
      "table",
      itemIndex,
    ) as string;
    const fieldName = executeFunctions.getNodeParameter(
      "fieldName",
      itemIndex,
    ) as string;
    const fieldMode = executeFunctions.getNodeParameter(
      "fieldMode",
      itemIndex,
    ) as string;
    let fieldType = executeFunctions.getNodeParameter(
      "fieldType",
      itemIndex,
    ) as string;

    // Validate required fields
    validateRequiredField(executeFunctions, tableInput, "Table", itemIndex);
    validateRequiredField(executeFunctions, fieldName, "Field Name", itemIndex);

    // Clean the table name
    const table = cleanTableName(tableInput);

    // Get options
    const options = executeFunctions.getNodeParameter(
      "options",
      itemIndex,
      {},
    ) as IDataObject;

    // Handle record table type if field type is record
    if (fieldType === "record") {
      const recordTableType = executeFunctions.getNodeParameter(
        "recordTableType",
        itemIndex,
        "",
      ) as string;
      if (recordTableType) {
        fieldType = `record<${recordTableType}>`;
      }
    }

    // Handle array type
    if (options.isArray === true) {
      fieldType = `array<${fieldType}>`;
    }

    // Handle optional type
    if (options.isOptional === true) {
      fieldType = `option<${fieldType}>`;
    }

    // Build credentials object
    const resolvedCredentials = buildCredentialsObject(credentials, options);

    // Build the query to create a field
    let query = `DEFINE FIELD ${fieldName} ON TABLE ${table} TYPE ${fieldType}`;

    // Add computation if it's a computed field
    if (fieldMode === "computed") {
      const computeExpression = executeFunctions.getNodeParameter(
        "computeExpression",
        itemIndex,
        "",
      ) as string;
      validateRequiredField(
        executeFunctions,
        computeExpression,
        "Computation Expression",
        itemIndex,
      );
      query += ` VALUE ${computeExpression}`;
    }
    // Add default value if provided and not a computed field
    else if (options.defaultValue) {
      let defaultValue = options.defaultValue as string;

      // Only add quotes for string types if not already quoted and not a SurrealQL function
      if (
        (fieldType === "string" || fieldType.includes("string")) &&
        typeof defaultValue === "string" &&
        !defaultValue.includes("::") &&
        !defaultValue.includes("(") &&
        !defaultValue.startsWith('"') &&
        !defaultValue.startsWith("'")
      ) {
        defaultValue = `"${defaultValue}"`;
      }

      query += ` DEFAULT ${defaultValue}`;
    }

    // Add flexible property if enabled
    if (options.isFlexible === true) {
      query += ` FLEXIBLE`;
    }

    // Add readonly property if enabled
    if (options.isReadOnly === true) {
      query += ` READONLY`;
    }

    // Add assertion if provided
    if (options.assertion) {
      query += ` ASSERT ${options.assertion}`;
    }

    // End the query
    query += ";";

    const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

    if (DEBUG) {
      // DEBUG: Log query
      debugLog("createField", "Prepared query", itemIndex, preparedQuery);
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
        "createField",
        "Raw query result",
        itemIndex,
        JSON.stringify(result),
      );
    }

    // Add the result to the returnData using our helper function
    addSuccessResult(
      returnData,
      {
        field: fieldName,
        table,
        type: fieldType,
        mode: fieldMode,
        flexible: options.isFlexible === true,
        readonly: options.isReadOnly === true,
        message: `Field ${fieldName} of type ${fieldType} created on table ${table}`,
      },
      itemIndex,
    );

    if (DEBUG)
      debugLog(
        "createField",
        `Completed, returning ${returnData.length} items`,
        itemIndex,
      );
    return returnData;
  },
};
