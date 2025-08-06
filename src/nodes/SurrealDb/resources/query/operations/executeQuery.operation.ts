import type {
    IExecuteFunctions,
    INodeExecutionData,
    IDataObject,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import type { IOperationHandler } from "../../../types/operation.types";
import type { Surreal } from "surrealdb";
import {
    validateRequiredField,
    validateAndParseData,
    prepareSurrealQuery,
    buildCredentialsObject,
    checkQueryResult,
} from "../../../GenericFunctions";
import { executeQueryWithRecovery } from "../../../errorHandling";
import {
    formatSingleResult,
    formatArrayResult,
    debugLog,
    createErrorResult,
} from "../../../utilities";
import {
    handleOperationError,
    retryWithBackoff,
    DEFAULT_RETRY_CONFIG,
    ErrorCategory,
} from "../../../errorHandling";

import { DEBUG } from "../../../debug";

/**
 * Execute Query operation handler for Query resource
 */
export const executeQueryOperation: IOperationHandler = {
    async execute(
        client: Surreal,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        try {
            if (DEBUG)
                debugLog("executeQuery", "Starting operation", itemIndex);

            // Get parameters for the specific item
            const query = executeFunctions.getNodeParameter(
                "query",
                itemIndex,
            ) as string;
            validateRequiredField(executeFunctions, query, "Query", itemIndex);

            // Get and validate parameters if provided
            const parametersInput = executeFunctions.getNodeParameter(
                "parameters",
                itemIndex,
                {},
            );
            const parameters = validateAndParseData(
                executeFunctions,
                parametersInput,
                "Parameters",
                itemIndex,
            );

            // Get options
            const options = executeFunctions.getNodeParameter(
                "options",
                itemIndex,
                {},
            ) as IDataObject;
            const limit = options.limit as number;
            const start = options.start as number;

            // Get credentials
            const credentials =
                await executeFunctions.getCredentials("surrealDbApi");

            // Build credentials object
            const resolvedCredentials = buildCredentialsObject(
                credentials,
                options,
            );

            // Check if the query already contains LIMIT or START clauses
            const hasLimit = query.toUpperCase().includes("LIMIT");
            const hasStart = query.toUpperCase().includes("START");

            // Modify the query to add pagination if needed
            // Note: SurrealDB requires START before LIMIT
            let finalQuery = query.trim();

            // Remove trailing semicolon if present to add pagination clauses before it
            const hasSemicolon = finalQuery.endsWith(";");
            if (hasSemicolon) {
                finalQuery = finalQuery.slice(0, -1);
            }

            if (start !== undefined && !hasStart) {
                finalQuery += ` START ${start}`;
            }
            if (limit !== undefined && !hasLimit) {
                finalQuery += ` LIMIT ${limit}`;
            }

            // Re-add semicolon if it was present
            if (hasSemicolon) {
                finalQuery += ";";
            }

            // Prepare the query based on authentication type
            finalQuery = prepareSurrealQuery(finalQuery, resolvedCredentials);

            if (DEBUG) {
                debugLog(
                    "executeQuery",
                    "Prepared query",
                    itemIndex,
                    finalQuery,
                );
                debugLog(
                    "executeQuery",
                    "Query parameters",
                    itemIndex,
                    parameters,
                );
            }

            // Execute the query with enhanced error handling and recovery
            const result = await retryWithBackoff(
                async () => {
                    return await executeQueryWithRecovery<[unknown[]]>(
                        client,
                        finalQuery,
                        resolvedCredentials,
                        parameters as Record<string, unknown>,
                    );
                },
                {
                    ...DEFAULT_RETRY_CONFIG,
                    retryableErrors: [
                        ErrorCategory.CONNECTION_ERROR,
                        ErrorCategory.TIMEOUT_ERROR,
                        ErrorCategory.RATE_LIMIT_ERROR,
                        ErrorCategory.SYSTEM_ERROR,
                    ],
                },
                {
                    operation: "executeQuery",
                    query: finalQuery.substring(0, 100) + "...", // Log partial query for security
                    parameters: Object.keys(
                        (parameters as Record<string, unknown>) || {},
                    ),
                },
            );

            // Check for query errors with enhanced error information
            const queryCheck = checkQueryResult(result, "Query failed");
            if (!queryCheck.success) {
                const error = new Error(
                    queryCheck.errorMessage || "Unknown query error",
                );

                if (executeFunctions.continueOnFail()) {
                    returnData.push(
                        createErrorResult(error, itemIndex, "executeQuery", {
                            query: finalQuery.substring(0, 100) + "...",
                            errorCategory: queryCheck.errorCategory,
                            errorSeverity: queryCheck.errorSeverity,
                            errorDetails: queryCheck.errorDetails,
                        }),
                    );
                } else {
                    throw new NodeOperationError(
                        executeFunctions.getNode(),
                        queryCheck.errorMessage || "Unknown error",
                        {
                            itemIndex,
                            description: `Error Category: ${queryCheck.errorCategory}, Severity: ${queryCheck.errorSeverity}`,
                        },
                    );
                }
            }

            if (DEBUG) {
                debugLog(
                    "executeQuery",
                    "Raw query result",
                    itemIndex,
                    JSON.stringify(result),
                );
            }

            // The result is an array of arrays, where each array contains the results of a statement
            if (Array.isArray(result)) {
                // Process each result set, filtering out null values
                for (const resultSet of result.filter(item => item !== null)) {
                    if (Array.isArray(resultSet)) {
                        // For array results, return each item as a separate n8n item
                        const formattedResults = formatArrayResult(resultSet);
                        if (formattedResults.length > 0) {
                            for (const formattedResult of formattedResults) {
                                returnData.push({
                                    ...formattedResult,
                                    pairedItem: { item: itemIndex },
                                });
                            }
                        } else {
                            // If resultSet was an empty array (e.g., SELECT returned no rows),
                            // push a single item representing this empty array result.
                            returnData.push({
                                json: {}, // Representing an empty result for this statement
                                pairedItem: { item: itemIndex },
                            });
                        }
                    } else {
                        // For single results, use the formatSingleResult function
                        const formattedResult = formatSingleResult(resultSet);
                        returnData.push({
                            ...formattedResult,
                            pairedItem: { item: itemIndex },
                        });
                    }
                }
            } else {
                // If the result is not an array, format it as a single result
                const formattedResult = formatSingleResult(result);
                returnData.push({
                    ...formattedResult,
                    pairedItem: { item: itemIndex },
                });
            }
        } catch (error) {
            // Use enhanced error handling
            returnData.push(
                handleOperationError(
                    error as Error,
                    executeFunctions,
                    itemIndex,
                    "executeQuery",
                    {
                        query: "Unknown", // query variable not available in catch scope
                        parameters: [], // parametersInput variable not available in catch scope
                    },
                ),
            );
        }

        if (DEBUG)
            debugLog(
                "executeQuery",
                `Completed, returning ${returnData.length} items`,
                itemIndex,
            );
        return returnData;
    },
};
