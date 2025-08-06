import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import { debugLog } from "../../../utilities";
import {
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
 * Implementation of the "Batch Delete" operation
 */
export const batchDeleteOperation: IOperationHandler = {
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
                    "batchDelete",
                    "Retrieved table parameter",
                    itemIndex,
                    table,
                );

            // Clean and standardize the table name
            table = cleanTableName(table);
            validateRequiredField(executeFunctions, table, "Table", itemIndex);

            const idsInput = executeFunctions.getNodeParameter(
                "ids",
                itemIndex,
            ) as string;
            if (DEBUG) {
                debugLog(
                    "batchDelete",
                    "Retrieved ids parameter",
                    itemIndex,
                    idsInput,
                );
            }

            // Validate required field
            if (!idsInput || idsInput.trim() === "") {
                throw new Error("Record IDs are required");
            }

            // Parse and validate record IDs
            const recordIds = idsInput
                .split(",")
                .map(id => id.trim())
                .filter(id => id.length > 0);

            if (recordIds.length === 0) {
                throw new Error("At least one record ID is required");
            }

            // Process record IDs to ensure they have table prefix if needed
            const processedIds = recordIds.map(id => {
                if (id.includes(":")) {
                    return id; // Already has table prefix
                } else {
                    return `${table}:${id}`; // Add table prefix
                }
            });

            if (DEBUG) {
                debugLog(
                    "batchDelete",
                    "Processed record IDs",
                    itemIndex,
                    processedIds,
                );
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
                    "batchDelete",
                    "Batch configuration",
                    itemIndex,
                    batchConfig,
                );
            }

            // Split IDs into batches
            const batches = splitIntoBatches(
                processedIds,
                batchConfig.batchSize,
            );

            if (DEBUG) {
                debugLog(
                    "batchDelete",
                    `Split ${processedIds.length} record IDs into ${batches.length} batches`,
                    itemIndex,
                );
            }

            // Process batches using shared utility
            const { results, totalProcessed, totalErrors } =
                await processBatches(
                    batches,
                    (batch, batchIndex) =>
                        processBatch(client, batch, batchIndex),
                    batchConfig,
                );

            // Prepare final result
            const finalResult = {
                totalRecords: processedIds.length,
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
 * Process a single batch of record IDs for deletion
 */
async function processBatch(
    client: Surreal,
    batch: string[],
    batchIndex: number,
): Promise<IBatchResult> {
    try {
        const results = [];

        // Process each record ID in the batch individually
        for (const recordId of batch) {
            const result = await client.delete(recordId);
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
