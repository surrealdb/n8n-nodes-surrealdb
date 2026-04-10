import type {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
} from "n8n-workflow";
import type { IOperationHandler } from "../../../types/operation.types";
import type { Surreal } from "surrealdb";
import { RecordId, Table } from "surrealdb";
import {
    validateRequiredField,
    validateAndParseData,
    cleanTableName,
} from "../../../GenericFunctions";
import { createRecordId, debugLog, addSuccessResult } from "../../../utilities";
import {
    handleOperationError,
    retryWithBackoff,
    DEFAULT_RETRY_CONFIG,
    ErrorCategory,
} from "../../../errorHandling";

import { DEBUG } from "../../../debug";

/**
 * Create Record operation handler for Record resource
 */
export const createRecordOperation: IOperationHandler = {
    async execute(
        client: Surreal,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        // Declare variables outside try block for access in catch block
        let table = "";
        let data: unknown = {};
        // v2 SDK: `client.create()` takes either a RecordId (for a specific
        // id) or a Table (for auto-generated id). Both are typed wrappers.
        let target: RecordId | Table | null = null;

        try {
            if (DEBUG)
                debugLog("createRecord", "Starting operation", itemIndex);

            // Get parameters
            const tableInput = executeFunctions.getNodeParameter(
                "table",
                itemIndex,
            ) as string;
            validateRequiredField(
                executeFunctions,
                tableInput,
                "Table",
                itemIndex,
            );
            table = cleanTableName(tableInput);

            // Get and validate record data
            const dataInput = executeFunctions.getNodeParameter(
                "data",
                itemIndex,
            );
            data = validateAndParseData(
                executeFunctions,
                dataInput,
                "Data",
                itemIndex,
            );

            // Check if specific ID is provided
            const providedId = executeFunctions.getNodeParameter(
                "id",
                itemIndex,
                "",
            ) as string;

            // Remove the id field from data if it exists and we have a specific ID provided
            // This prevents SurrealDB from throwing an error about conflicting id specifications
            if (
                providedId &&
                providedId.trim() !== "" &&
                data &&
                typeof data === "object" &&
                "id" in data
            ) {
                delete data.id;
            }

            if (providedId && providedId.trim() !== "") {
                if (DEBUG)
                    debugLog(
                        "createRecord",
                        "Using provided ID",
                        itemIndex,
                        providedId,
                    );
                // Create the record ID with the provided ID
                target = createRecordId(table, providedId.trim());
            } else {
                // No ID provided — target the Table so SurrealDB auto-generates the id
                if (DEBUG)
                    debugLog(
                        "createRecord",
                        "No ID provided, targeting table for auto-ID generation",
                        itemIndex,
                    );
                target = new Table(table);
            }

            // Get credentials to ensure they are configured
            await executeFunctions.getCredentials("surrealDbApi");

            if (DEBUG) {
                debugLog("createRecord", "Create target", itemIndex, target);
                debugLog(
                    "createRecord",
                    "Data",
                    itemIndex,
                    JSON.stringify(data),
                );
            }

            // Create the record with enhanced error handling and retry logic.
            // v2 builder chain: client.create(target).content(data). The two
            // create() overloads (RecordId vs Table) are mutually exclusive,
            // so we narrow with instanceof to pick the right one — TypeScript
            // can't dispatch a union across separate overloads.
            const result = await retryWithBackoff(
                async () => {
                    const record = data as Record<string, unknown>;
                    // .json() converts RecordId/Datetime/etc. wrappers in the
                    // response to JSON-safe types so n8n can serialize them.
                    if (target instanceof RecordId) {
                        return await client
                            .create(target)
                            .json()
                            .content(record);
                    }
                    if (target instanceof Table) {
                        return await client
                            .create(target)
                            .json()
                            .content(record);
                    }
                    throw new Error("createRecord: target was not initialized");
                },
                {
                    ...DEFAULT_RETRY_CONFIG,
                    retryableErrors: [
                        ErrorCategory.CONNECTION_ERROR,
                        ErrorCategory.TIMEOUT_ERROR,
                        ErrorCategory.SYSTEM_ERROR,
                    ],
                },
                {
                    operation: "createRecord",
                    table,
                    recordId:
                        target instanceof RecordId
                            ? target.toString()
                            : "auto-generated",
                    dataKeys: Object.keys(
                        (data as Record<string, unknown>) || {},
                    ),
                },
            );

            if (DEBUG) {
                debugLog(
                    "createRecord",
                    "Raw creation result",
                    itemIndex,
                    JSON.stringify(result),
                );
            }

            // Return the raw SurrealDB response directly without transformation
            // This respects SurrealDB's native data format and ensures future compatibility
            if (DEBUG)
                debugLog(
                    "createRecord",
                    "Returning raw result",
                    itemIndex,
                    JSON.stringify(result),
                );

            // Handle null/undefined result
            if (result === null || result === undefined) {
                addSuccessResult(returnData, {} as IDataObject, itemIndex); // Empty object for null/undefined results
            } else {
                addSuccessResult(
                    returnData,
                    result as unknown as IDataObject,
                    itemIndex,
                );
            }
        } catch (error) {
            // Use enhanced error handling
            returnData.push(
                handleOperationError(
                    error as Error,
                    executeFunctions,
                    itemIndex,
                    "createRecord",
                    {
                        table,
                        recordId:
                            target instanceof RecordId
                                ? target.toString()
                                : "auto-generated",
                        dataKeys: Object.keys(
                            (data as Record<string, unknown>) || {},
                        ),
                    },
                ),
            );
        }

        if (DEBUG)
            debugLog(
                "createRecord",
                `Completed, returning ${returnData.length} items`,
                itemIndex,
            );
        return returnData;
    },
};
