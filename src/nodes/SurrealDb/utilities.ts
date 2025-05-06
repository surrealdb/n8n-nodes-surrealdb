import type { IPairedItemData, INodeExecutionData } from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import { RecordId } from "surrealdb";

/**
 * Generate paired item data for the given number of items
 */
export function generatePairedItemData(length: number): IPairedItemData[] {
  return Array.from({ length }, (_, index) => ({
    item: index,
  }));
}

/**
 * Create a RecordId object from table name and ID
 * This is required for SurrealDB operations that work with specific records
 * @param table The table name
 * @param id The record ID
 * @returns A RecordId object that can be used with SurrealDB SDK methods
 */
export function createRecordId(table: string, id: string): RecordId {
  return new RecordId(table, id);
}

/**
 * Parses and validates a record ID string, handling composite IDs (table:id).
 * If a composite ID is provided, it verifies that the table prefix matches the expected table.
 * @param recordIdString The raw record ID string from the node parameter.
 * @param expectedTable The expected table name for the operation.
 * @param node The n8n node instance for error reporting.
 * @param itemIndex The index of the current item for error reporting.
 * @returns The validated and potentially stripped record ID string.
 * @throws {NodeOperationError} If the record ID is invalid or the table prefix does not match.
 */
export function parseAndValidateRecordId(
  recordIdString: string | any,
  expectedTable: string,
  node: any,
  itemIndex: number
): string {
  // Ensure recordIdString is a string
  const idStr = String(recordIdString || "");

  if (idStr.includes(":")) {
    const [tablePrefix, id] = idStr.split(":");
    if (tablePrefix !== expectedTable) {
      throw new NodeOperationError(
        node,
        `Record ID table prefix "${tablePrefix}" does not match the specified table "${expectedTable}".`,
        { itemIndex }
      );
    }
    return id;
  }
  return idStr;
}

/**
 * Format single result output
 * Standardizes the output format for operations that return a single result
 */
export function formatSingleResult(result: any): INodeExecutionData {
  return { json: result };
}

/**
 * Format array result output
 * Standardizes the output format for operations that return an array of results
 * Each item in the array becomes a separate n8n item
 */
export function formatArrayResult(results: any[]): INodeExecutionData[] {
  return results.map((item) => ({ json: item }));
}

/**
 * Standard debug logging function
 * Use this for consistent debug log formatting across operations
 *
 * @param operation The name of the operation (e.g., "createRecord", "getAllRecords")
 * @param message The log message
 * @param itemIndex The index of the current item (optional)
 * @param data Additional data to log (optional)
 */
export function debugLog(
  operation: string,
  message: string,
  itemIndex?: number,
  data?: any
): void {
  // Determine if itemIndex should be included in the log
  const indexPart = itemIndex !== undefined ? ` [item:${itemIndex}]` : "";

  // Basic log without additional data
  if (data === undefined) {
    console.log(`DEBUG (${operation})${indexPart} - ${message}`);
  }
  // Log with additional data
  else {
    console.log(`DEBUG (${operation})${indexPart} - ${message}`, data);
  }
}

/**
 * Create a standardized success result item with consistent structure
 *
 * @param data The operation-specific data to include in the result
 * @param itemIndex The index of the current item for pairedItem
 * @returns An INodeExecutionData object with standardized structure
 */
export function createSuccessResult(
  data: Record<string, any>,
  itemIndex: number
): INodeExecutionData {
  return {
    json: data,
    pairedItem: { item: itemIndex },
  };
}

/**
 * Add a standardized success result to the returnData array
 *
 * @param returnData The array to add the result to
 * @param data The operation-specific data to include in the result
 * @param itemIndex The index of the current item for pairedItem
 */
export function addSuccessResult(
  returnData: INodeExecutionData[],
  data: Record<string, any>,
  itemIndex: number
): void {
  returnData.push(createSuccessResult(data, itemIndex));
}

/**
 * Create a standardized error result item for continueOnFail=true scenarios
 *
 * @param error The error object or message
 * @param itemIndex The index of the current item for pairedItem
 * @returns An INodeExecutionData object with standardized error structure
 */
export function createErrorResult(
  error: Error | string,
  itemIndex: number
): INodeExecutionData {
  const errorMessage = typeof error === "string" ? error : error.message;

  return {
    json: {
      error: errorMessage,
    },
    pairedItem: { item: itemIndex },
  };
}

/**
 * Add a standardized error result to the returnData array
 *
 * @param returnData The array to add the error to
 * @param error The error object or message
 * @param itemIndex The index of the current item for pairedItem
 */
export function addErrorResult(
  returnData: INodeExecutionData[],
  error: Error | string,
  itemIndex: number
): void {
  returnData.push(createErrorResult(error, itemIndex));
}
