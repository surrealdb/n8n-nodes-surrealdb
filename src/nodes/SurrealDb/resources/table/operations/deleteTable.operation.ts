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
import { debugLog } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from "../../../debug";

/**
 * Implementation of the "Delete Table" operation
 * This operation completely removes a table from the database
 */
export const deleteTableOperation: IOperationHandler = {
    async execute(
        client: Surreal,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        // Get parameters
        let table = executeFunctions.getNodeParameter(
            "table",
            itemIndex,
        ) as string;
        validateRequiredField(executeFunctions, table, "Table", itemIndex);

        // Clean and standardize the table name
        table = cleanTableName(table);

        // Get options
        const options = executeFunctions.getNodeParameter(
            "options",
            itemIndex,
            {},
        ) as IDataObject;

        // Get credentials
        const credentials =
            await executeFunctions.getCredentials("surrealDbApi");

        // Build the resolved credentials object
        const resolvedCredentials = buildCredentialsObject(
            credentials,
            options,
        );

        // Build the query to remove the table
        const query = `REMOVE TABLE ${table}`;
        const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

        if (DEBUG) {
            debugLog("deleteTable", "Query", itemIndex, preparedQuery);
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
                throw new NodeOperationError(
                    executeFunctions.getNode(),
                    queryCheck.errorMessage || "Unknown error",
                    {
                        itemIndex,
                    },
                );
            }
        }

        if (DEBUG) {
            debugLog(
                "deleteTable",
                "Raw query result",
                itemIndex,
                JSON.stringify(result),
            );
        }

        // For DELETE TABLE operations, SurrealDB typically returns [null]
        // We need to ensure we always return a valid json property for n8n
        returnData.push({
            json: {}, // Empty object is the minimal valid json property
            pairedItem: { item: itemIndex },
        });

        return returnData;
    },
};
