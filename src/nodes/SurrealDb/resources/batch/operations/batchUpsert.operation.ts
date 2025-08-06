import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import { debugLog } from "../../../utilities";
import {
    validateJSON,
    validateRequiredField,
    cleanTableName,
} from "../../../GenericFunctions";
import type { IOperationHandler } from "../../../types/operation.types";
import {
    IBatchConfig,
    IBatchResult,
    processBatches,
    splitIntoBatches,
    createBatchResult,
} from "../batch.utilities";

import { DEBUG } from "../../../debug";

/**
 * Implementation of the "Batch Upsert" operation
 */
export const batchUpsertOperation: IOperationHandler = {
    async execute(
        client: Surreal,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        try {
            // Get parameters
            let table = executeFunctions.getNodeParameter(
                "table",
                itemIndex,
            ) as string;
            if (DEBUG)
                debugLog(
                    "batchUpsert",
                    "Retrieved table parameter",
                    itemIndex,
                    table,
                );

            // Clean and standardize the table name
            table = cleanTableName(table);
            validateRequiredField(executeFunctions, table, "Table", itemIndex);

            const dataInput = executeFunctions.getNodeParameter(
                "data",
                itemIndex,
            );
            if (DEBUG) {
                debugLog(
                    "batchUpsert",
                    "Retrieved data parameter raw value",
                    itemIndex,
                    dataInput,
                );
            }

            // Validate required field
            if (
                dataInput === undefined ||
                dataInput === null ||
                dataInput === ""
            ) {
                throw new Error("Records Data is required");
            }

            // Process data based on type
            let data: unknown;
            if (typeof dataInput === "string") {
                data = validateJSON(executeFunctions, dataInput, itemIndex);
            } else if (Array.isArray(dataInput)) {
                data = dataInput;
            } else {
                throw new Error(
                    `Records Data must be a JSON string or a JSON array, received type: ${typeof dataInput}`,
                );
            }

            // Validate that data is an array
            if (!Array.isArray(data)) {
                throw new Error("Processed Records Data must be an array");
            }

            // Validate that each record has an ID for upsert operations
            for (let i = 0; i < data.length; i++) {
                const record = data[i];
                if (!record || typeof record !== "object") {
                    throw new Error(
                        `Record at index ${i} is not a valid object`,
                    );
                }
                if (!record.id) {
                    throw new Error(
                        `Record at index ${i} is missing required 'id' field for upsert operation`,
                    );
                }
            }

            // Get batch configuration
            const batchConfigInput = executeFunctions.getNodeParameter(
                "batchConfig",
                itemIndex,
                {},
            ) as {
                batchSize?: number;
                parallel?: boolean;
                maxParallelBatches?: number;
                errorHandling?: "stop" | "continue" | "partial";
                transaction?: boolean;
                progressTracking?: boolean;
            };
            const batchConfig: IBatchConfig = {
                batchSize: batchConfigInput.batchSize || 100,
                parallel: batchConfigInput.parallel || false,
                maxParallelBatches: batchConfigInput.maxParallelBatches || 3,
                errorHandling: batchConfigInput.errorHandling || "stop",
                transaction: batchConfigInput.transaction || false,
                progressTracking: batchConfigInput.progressTracking !== false,
            };

            if (DEBUG) {
                debugLog(
                    "batchUpsert",
                    "Batch configuration",
                    itemIndex,
                    batchConfig,
                );
            }

            // Split data into batches
            const batches = splitIntoBatches(data, batchConfig.batchSize);

            if (DEBUG) {
                debugLog(
                    "batchUpsert",
                    `Split ${data.length} records into ${batches.length} batches`,
                    itemIndex,
                );
            }

            // Process batches using shared utility
            const { results, totalProcessed, totalErrors } =
                await processBatches(
                    batches,
                    (batch, batchIndex) =>
                        processBatch(client, table, batch, batchIndex),
                    batchConfig,
                );

            // Prepare final result
            const finalResult = {
                totalRecords: data.length,
                totalBatches: batches.length,
                totalProcessed,
                totalErrors,
                batches: results,
                success:
                    totalErrors === 0 || batchConfig.errorHandling !== "stop",
            };

            returnData.push({
                json: finalResult,
                pairedItem: { item: itemIndex },
            });
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

/**
 * Process a single batch of records for upsert
 */
async function processBatch(
    client: Surreal,
    table: string,
    batch: Record<string, unknown>[],
    batchIndex: number,
): Promise<IBatchResult> {
    try {
        const results = [];

        // Process each record in the batch individually for upsert
        for (const record of batch) {
            const recordId = record.id as string;
            const recordData = { ...record } as Record<string, unknown>;
            delete recordData.id; // Remove id from the data to be upserted

            // Use the upsert method which will create if doesn't exist, or update if it does
            const result = await client.upsert(recordId, recordData);
            results.push(result);
        }

        return createBatchResult(true, results, batchIndex, results.length);
    } catch (error) {
        return createBatchResult(
            false,
            undefined,
            batchIndex,
            0,
            error.message || String(error),
        );
    }
}
