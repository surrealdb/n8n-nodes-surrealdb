import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import type { IOperationHandler } from "../../../types/operation.types";
import type { Surreal } from "surrealdb";
import {
  validateRequiredField,
  validateAndParseData,
  cleanTableName,
} from "../../../GenericFunctions";
import {
  createRecordId,
  parseAndValidateRecordId,
  debugLog,
  addSuccessResult,
  addErrorResult,
} from "../../../utilities";

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Upsert Record operation handler for Record resource
 */
export const upsertRecordOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number
  ): Promise<INodeExecutionData[]> {
    if (DEBUG) debugLog("upsertRecord", "Starting operation", itemIndex);
    // Get parameters
    let table = executeFunctions.getNodeParameter("table", itemIndex) as string;
    const idInput = executeFunctions.getNodeParameter(
      "id",
      itemIndex
    ) as string;

    // Clean and standardize the table name
    table = cleanTableName(table);

    // Ensure idInput is a string
    const idInputStr = String(idInput || "");

    // If no table is specified but idInput has a table prefix, use the extracted table
    if (!table && idInputStr.includes(":")) {
      table = idInputStr.split(":")[0];
    }

    // Only validate table as required if it couldn't be extracted from the Record ID
    if (!table) {
      throw new NodeOperationError(
        executeFunctions.getNode(),
        'Either Table field must be provided or Record ID must include a table prefix (e.g., "table:id")',
        { itemIndex }
      );
    }
    validateRequiredField(executeFunctions, idInput, "Record ID", itemIndex);

    // Parse and validate the record ID string
    const validatedId = parseAndValidateRecordId(
      idInput,
      table,
      executeFunctions.getNode(),
      itemIndex
    );

    // Get and validate record data
    const dataInput = executeFunctions.getNodeParameter("data", itemIndex);
    const data = validateAndParseData(
      executeFunctions,
      dataInput,
      "Data",
      itemIndex
    );

    // Create the record ID
    const recordId = createRecordId(table, validatedId);

    try {
      // For upsert, we use the upsert method which will create the record if it doesn't exist
      // According to the SurrealDB documentation, this is the correct method for upserting records
      const result = await client.upsert(recordId, data);

      // Add success result with standardized format
      const returnData: INodeExecutionData[] = [];
      addSuccessResult(returnData, result, itemIndex);
      return returnData;
    } catch (error) {
      // Handle errors based on continueOnFail setting
      if (executeFunctions.continueOnFail()) {
        const returnData: INodeExecutionData[] = [];
        addErrorResult(returnData, error, itemIndex);
        return returnData;
      }

      // If continueOnFail is not enabled, throw a properly formatted error
      throw new NodeOperationError(executeFunctions.getNode(), error.message, {
        itemIndex,
      });
    }
  },
};
