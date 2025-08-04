import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import { formatArrayResult, debugLog } from "../../../utilities";
import {
  validateJSON,
  validateRequiredField,
  cleanTableName,
} from "../../../GenericFunctions";
import type { IOperationHandler } from "../../../types/operation.types";

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Create Many Records" operation
 */
export const createManyOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    try {
      // Get parameters
      let table = executeFunctions.getNodeParameter(
        "table",
        itemIndex
      ) as string;
      if (DEBUG)
        debugLog("createMany", "Retrieved table parameter", itemIndex, table);

      // Clean and standardize the table name
      table = cleanTableName(table);

      validateRequiredField(executeFunctions, table, "Table", itemIndex); // Validate table after potential extraction

      const dataInput = executeFunctions.getNodeParameter("data", itemIndex); // Get the parameter named 'data' - could be string or array
      if (DEBUG) {
        debugLog(
          "createMany",
          "Retrieved data parameter raw value",
          itemIndex,
          dataInput
        );
        debugLog(
          "createMany",
          "Retrieved data parameter type",
          itemIndex,
          typeof dataInput
        );
      }

      // Validate required field based on raw input
      if (dataInput === undefined || dataInput === null || dataInput === "") {
        throw new Error("Records Data is required");
      }

      // Process data based on type
      let data: unknown;
      if (typeof dataInput === "string") {
        // If it's a string, parse and validate as JSON
        if (DEBUG)
          debugLog(
            "createMany",
            "Processing data parameter as string",
            itemIndex
          );
        data = validateJSON(executeFunctions, dataInput, itemIndex);
      } else if (Array.isArray(dataInput)) {
        // If it's already an array, use it directly
        if (DEBUG)
          debugLog(
            "createMany",
            "Processing data parameter as array",
            itemIndex
          );
        data = dataInput;
        // Optional: Add validation here to ensure it's an array of objects if needed
      } else {
        // Handle unexpected types
        throw new Error(
          `Records Data must be a JSON string or a JSON array, received type: ${typeof dataInput}`
        );
      }

      // Validate that data is an array after processing
      if (!Array.isArray(data)) {
        throw new Error("Processed Records Data must be an array");
      }
      if (DEBUG)
        debugLog(
          "createMany",
          "Processed data",
          itemIndex,
          JSON.stringify(data)
        );

      // Execute the insert operation to create multiple records
      // The insert method accepts an array of objects directly
      const result = await client.insert(table, data);

      // The result from client.insert with an array is expected to be an array of created records.
      if (Array.isArray(result)) {
        // Format the results
        const formattedResults = formatArrayResult(result);

        // Add each record as a separate item
        for (const formattedResult of formattedResults) {
          returnData.push({
            ...formattedResult,
            pairedItem: { item: itemIndex },
          });
        }
      }
      // If no records created, return an empty array
    } catch (error) {
      if (executeFunctions.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: itemIndex },
        });
      } else {
        throw error;
      }
    }

    return returnData;
  },
};
