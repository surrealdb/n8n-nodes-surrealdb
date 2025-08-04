import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject

} from "n8n-workflow";
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

import { DEBUG } from '../../../debug';

/**
 * Update Record operation handler for Record resource
 */
export const updateRecordOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    try {
      if (DEBUG) debugLog("updateRecord", "Starting operation", itemIndex);
      // Get parameters
      let table = executeFunctions.getNodeParameter(
        "table",
        itemIndex,
      ) as string;
      const idInput = executeFunctions.getNodeParameter(
        "id",
        itemIndex,
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
          { itemIndex },
        );
      }
      validateRequiredField(executeFunctions, idInput, "Record ID", itemIndex);

      // Parse and validate the record ID string
      const validatedId = parseAndValidateRecordId(
        idInput,
        table,
        executeFunctions.getNode(),
        itemIndex,
      );

      // Create the record ID
      const recordId = createRecordId(table, validatedId);

      // Get the update mode
      const updateMode = executeFunctions.getNodeParameter(
        "updateMode",
        itemIndex,
      ) as string;

      let result: unknown;

      if (updateMode === "set") {
        // Handle SET operations mode
        const setOperationsInput = executeFunctions.getNodeParameter(
          "setOperations",
          itemIndex,
        ) as IDataObject;
        const operations = setOperationsInput?.operations || [];

        if (DEBUG) {
          debugLog(
            "updateRecord",
            "setOperationsInput:",
            itemIndex,
            setOperationsInput,
          );
          debugLog("updateRecord", "operations:", itemIndex, operations);
        }

        if (
          !operations ||
          !Array.isArray(operations) ||
          operations.length === 0
        ) {
          throw new NodeOperationError(
            executeFunctions.getNode(),
            "At least one SET operation is required when using Set Fields mode",
            { itemIndex },
          );
        }

        // Build the SET clause
        const setClause = (operations as IDataObject[])
          .map((op: IDataObject) => {
            const { field, operator, value } = op;

            // Validate the operation - be more specific about what's missing
            if (!field || typeof field !== "string" || field.trim() === "") {
              throw new NodeOperationError(
                executeFunctions.getNode(),
                "Each SET operation must have a field name",
                { itemIndex },
              );
            }

            if (value === undefined || value === null) {
              throw new NodeOperationError(
                executeFunctions.getNode(),
                `SET operation for field '${field}' is missing a value`,
                { itemIndex },
              );
            }

            // Parse the value as JSON to handle different data types
            let parsedValue: unknown;
            try {
              parsedValue = JSON.parse(value as string);
            } catch {
              // If JSON parse fails, treat as string (but don't wrap in quotes yet)
              parsedValue = value;
            }

            // For SurrealDB query, we need to format the value properly
            let formattedValue: string;
            if (typeof parsedValue === "string") {
              // For strings, only add quotes if they're not already present
              if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
                formattedValue = parsedValue; // Already quoted
              } else {
                formattedValue = `"${parsedValue}"`; // Add quotes
              }
            } else {
              formattedValue = JSON.stringify(parsedValue);
            }

            // Default to "=" if operator is empty (temporary fix for UI issue)
            let finalOperator =
              !operator ||
                typeof operator !== "string" ||
                operator.trim() === ""
                ? "="
                : operator;

            // Handle string concatenation special case
            if (finalOperator === "+ =") {
              // For string concatenation, we need to generate: field = field + value
              return `${field} = ${field} + ${formattedValue}`;
            }

            return `${field} ${finalOperator} ${formattedValue}`;
          })
          .join(", ");

        // Execute UPDATE...SET query
        const query = `UPDATE ${recordId.toString()} SET ${setClause}`;
        if (DEBUG) {
          debugLog("updateRecord", `Executing SET query: ${query}`, itemIndex);
        }

        const queryResult = await client.query(query);
        if (DEBUG) {
          debugLog("updateRecord", "Raw query result:", itemIndex, queryResult);
        }

        // SurrealDB query returns an array of results, we need to extract the actual updated record
        // The structure is typically: [{ result: [updatedRecord] }] or [[updatedRecord]]
        if (queryResult && queryResult.length > 0) {
          const firstResult = queryResult[0];
          // Handle different possible result structures
          if (Array.isArray(firstResult)) {
            result = firstResult.length > 0 ? firstResult[0] : null;
          } else if (
            firstResult &&
            typeof firstResult === "object" &&
            "result" in firstResult
          ) {
            result =
              Array.isArray(firstResult.result) && firstResult.result.length > 0
                ? firstResult.result[0]
                : firstResult.result;
          } else {
            result = firstResult;
          }
        } else {
          result = null;
        }
      } else {
        // Handle traditional replace mode
        const dataInput = executeFunctions.getNodeParameter("data", itemIndex);
        const data = validateAndParseData(
          executeFunctions,
          dataInput,
          "Data",
          itemIndex,
        );

        // Remove the id field from data if it exists, since we're specifying the record ID explicitly
        // This prevents SurrealDB from throwing an error about conflicting id specifications
        if (data && typeof data === "object" && "id" in data) {
          delete data.id;
        }

        // First check if record exists
        const existingRecord = await client.select(recordId);

        // If record doesn't exist, throw error
        if (
          existingRecord === null ||
          existingRecord === undefined ||
          (typeof existingRecord === "object" &&
            Object.keys(existingRecord).length === 0)
        ) {
          throw new NodeOperationError(
            executeFunctions.getNode(),
            `Cannot update record: Record not found: ${recordId.toString()}`,
            { itemIndex },
          );
        }

        // Execute the update operation
        result = await client.update(recordId, data as Record<string, unknown>);
      }

      // Check if the operation was successful
      if (result === null || result === undefined) {
        throw new NodeOperationError(
          executeFunctions.getNode(),
          `Failed to update record: ${recordId.toString()}`,
          { itemIndex },
        );
      }

      // Return the result using standardized success result handling
      const returnData: INodeExecutionData[] = [];
      addSuccessResult(
        returnData,
        result as Record<string, unknown>,
        itemIndex,
      );
      return returnData;
    } catch (error) {
      // Handle errors based on continueOnFail setting
      if (executeFunctions.continueOnFail()) {
        const returnData: INodeExecutionData[] = [];
        addErrorResult(returnData, error, itemIndex);
        return returnData;
      }

      // If continueOnFail is not enabled, re-throw the error
      throw error;
    }
  },
};
