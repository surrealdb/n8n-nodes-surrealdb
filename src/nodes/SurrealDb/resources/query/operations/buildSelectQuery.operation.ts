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

interface WhereCondition {
    field: string;
    operator: string;
    value?: string;
    logicalOperator: string;
}

interface OrderByCondition {
    field: string;
    direction: string;
}

/**
 * Build a WHERE clause from conditions
 */
function buildWhereClause(conditions: WhereCondition[]): string {
    if (!conditions || conditions.length === 0) {
        return "";
    }

    const clauses: string[] = [];

    for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];

        if (!condition.field || !condition.operator) {
            continue;
        }

        let clause = `${condition.field} ${condition.operator}`;

        // Add value for operators that need it
        if (
            condition.value !== undefined &&
            condition.value !== "" &&
            !["IS NULL", "IS NOT NULL"].includes(condition.operator)
        ) {
            // Check if the value looks like a parameter
            if (condition.value.startsWith("$")) {
                clause += ` ${condition.value}`;
            } else {
                // Try to determine if it's a number, boolean, or string
                const trimmedValue = condition.value.trim();
                if (trimmedValue === "true" || trimmedValue === "false") {
                    clause += ` ${trimmedValue}`;
                } else if (
                    !isNaN(Number(trimmedValue)) &&
                    trimmedValue !== ""
                ) {
                    clause += ` ${trimmedValue}`;
                } else {
                    // Treat as string, wrap in quotes
                    clause += ` '${condition.value.replace(/'/g, "\\'")}'`;
                }
            }
        }

        clauses.push(clause);
    }

    return clauses.length > 0 ? ` WHERE ${clauses.join(" ")}` : "";
}

/**
 * Build an ORDER BY clause from conditions
 */
function buildOrderByClause(conditions: OrderByCondition[]): string {
    if (!conditions || conditions.length === 0) {
        return "";
    }

    const clauses: string[] = [];

    for (const condition of conditions) {
        if (condition.field && condition.direction) {
            clauses.push(`${condition.field} ${condition.direction}`);
        }
    }

    return clauses.length > 0 ? ` ORDER BY ${clauses.join(", ")}` : "";
}

/**
 * Build Select Query operation handler for Query resource
 */
export const buildSelectQueryOperation: IOperationHandler = {
    async execute(
        client: Surreal,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        try {
            if (DEBUG)
                debugLog("buildSelectQuery", "Starting operation", itemIndex);

            // Get parameters for the specific item
            const table = executeFunctions.getNodeParameter(
                "table",
                itemIndex,
            ) as string;
            validateRequiredField(executeFunctions, table, "Table", itemIndex);

            const fields = executeFunctions.getNodeParameter(
                "fields",
                itemIndex,
                "*",
            ) as string;

            const whereConditions = executeFunctions.getNodeParameter(
                "whereConditions",
                itemIndex,
                {},
            ) as IDataObject;

            const orderBy = executeFunctions.getNodeParameter(
                "orderBy",
                itemIndex,
                {},
            ) as IDataObject;

            const groupBy = executeFunctions.getNodeParameter(
                "groupBy",
                itemIndex,
                "",
            ) as string;

            const limit = executeFunctions.getNodeParameter(
                "limit",
                itemIndex,
                100,
            ) as number;

            const start = executeFunctions.getNodeParameter(
                "start",
                itemIndex,
                0,
            ) as number;

            const splitOn = executeFunctions.getNodeParameter(
                "splitOn",
                itemIndex,
                "",
            ) as string;

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
            const returnGeneratedQuery =
                options.returnGeneratedQuery as boolean;

            // Get credentials
            const credentials =
                await executeFunctions.getCredentials("surrealDbApi");

            // Build credentials object
            const resolvedCredentials = buildCredentialsObject(
                credentials,
                options,
            );

            // Build the SELECT query
            let query = `SELECT ${fields} FROM ${table}`;

            // Add WHERE clause
            if (
                whereConditions.condition &&
                Array.isArray(whereConditions.condition)
            ) {
                const whereClause = buildWhereClause(
                    whereConditions.condition as WhereCondition[],
                );
                query += whereClause;
            }

            // Add GROUP BY clause
            if (groupBy && groupBy.trim()) {
                query += ` GROUP BY ${groupBy.trim()}`;
            }

            // Add ORDER BY clause
            if (orderBy.order && Array.isArray(orderBy.order)) {
                const orderByClause = buildOrderByClause(
                    orderBy.order as OrderByCondition[],
                );
                query += orderByClause;
            }

            // Add SPLIT ON clause
            if (splitOn && splitOn.trim()) {
                query += ` SPLIT ON ${splitOn.trim()}`;
            }

            // Add START and LIMIT clauses
            if (start > 0) {
                query += ` START ${start}`;
            }
            if (limit > 0) {
                query += ` LIMIT ${limit}`;
            }

            // Prepare the query based on authentication type
            const finalQuery = prepareSurrealQuery(query, resolvedCredentials);

            if (DEBUG) {
                debugLog(
                    "buildSelectQuery",
                    "Generated query",
                    itemIndex,
                    finalQuery,
                );
                debugLog(
                    "buildSelectQuery",
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
                    operation: "buildSelectQuery",
                    query: finalQuery.substring(0, 100) + "...", // Log partial query for security
                    parameters: Object.keys(
                        (parameters as Record<string, unknown>) || {},
                    ),
                },
            );

            // Check for query errors with enhanced error information
            const queryCheck = checkQueryResult(result, "Select query failed");
            if (!queryCheck.success) {
                const error = new Error(
                    queryCheck.errorMessage || "Unknown query error",
                );

                if (executeFunctions.continueOnFail()) {
                    returnData.push(
                        createErrorResult(
                            error,
                            itemIndex,
                            "buildSelectQuery",
                            {
                                query: finalQuery.substring(0, 100) + "...",
                                errorCategory: queryCheck.errorCategory,
                                errorSeverity: queryCheck.errorSeverity,
                                errorDetails: queryCheck.errorDetails,
                            },
                        ),
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
                    "buildSelectQuery",
                    "Raw query result",
                    itemIndex,
                    JSON.stringify(result),
                );
            }

            // Process the results
            if (Array.isArray(result)) {
                // Process each result set, filtering out null values
                for (const resultSet of result.filter(item => item !== null)) {
                    if (Array.isArray(resultSet)) {
                        // For array results, return each item as a separate n8n item
                        const formattedResults = formatArrayResult(resultSet);
                        if (formattedResults.length > 0) {
                            for (const formattedResult of formattedResults) {
                                const itemData = { ...formattedResult };

                                // Add generated query to output if requested
                                if (returnGeneratedQuery) {
                                    itemData.generatedQuery = finalQuery;
                                }

                                returnData.push({
                                    json: itemData,
                                    pairedItem: { item: itemIndex },
                                });
                            }
                        } else {
                            // If resultSet was an empty array, push a single item representing this empty array result
                            const itemData: IDataObject = {};
                            if (returnGeneratedQuery) {
                                itemData.generatedQuery = finalQuery;
                            }
                            returnData.push({
                                json: itemData,
                                pairedItem: { item: itemIndex },
                            });
                        }
                    } else {
                        // For single results, use the formatSingleResult function
                        const formattedResult = formatSingleResult(resultSet);
                        const itemData = { ...formattedResult };

                        if (returnGeneratedQuery) {
                            itemData.generatedQuery = finalQuery;
                        }

                        returnData.push({
                            json: itemData,
                            pairedItem: { item: itemIndex },
                        });
                    }
                }
            } else {
                // If the result is not an array, format it as a single result
                const formattedResult = formatSingleResult(result);
                const itemData = { ...formattedResult };

                if (returnGeneratedQuery) {
                    itemData.generatedQuery = finalQuery;
                }

                returnData.push({
                    json: itemData,
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
                    "buildSelectQuery",
                    {
                        query: "Unknown", // query variable not available in catch scope
                        parameters: [], // parametersInput variable not available in catch scope
                    },
                ),
            );
        }

        if (DEBUG)
            debugLog(
                "buildSelectQuery",
                `Completed, returning ${returnData.length} items`,
                itemIndex,
            );
        return returnData;
    },
};
