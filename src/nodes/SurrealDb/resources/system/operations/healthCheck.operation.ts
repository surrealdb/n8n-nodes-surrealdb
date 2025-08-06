import type {
    IExecuteFunctions,
    INodeExecutionData,
    IHttpRequestOptions,
    IDataObject,
} from "n8n-workflow";
import type { IOperationHandler } from "../../../types/operation.types";
import type { Surreal } from "surrealdb";
import { buildCredentialsObject } from "../../../GenericFunctions";
import { debugLog, addSuccessResult } from "../../../utilities";

import { DEBUG } from "../../../debug";

/**
 * Health Check operation handler for System resource
 */
export const healthCheckOperation: IOperationHandler = {
    async execute(
        client: Surreal,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        if (DEBUG) debugLog("healthCheck", "Starting operation", itemIndex);

        // Get the credentials from the client (they're already validated and resolved)
        const credentials =
            await executeFunctions.getCredentials("surrealDbApi");
        const options = executeFunctions.getNodeParameter(
            "options",
            itemIndex,
            {},
        ) as IDataObject;

        // Build the resolved credentials object using utility function
        const resolvedCredentials = buildCredentialsObject(
            credentials,
            options,
        );

        // Get the base URL from the connection string
        // Ensure the URL ends with a slash
        let baseUrl = resolvedCredentials.connectionString;
        if (!baseUrl.endsWith("/")) {
            baseUrl += "/";
        }

        // Create the health check URL
        const healthUrl = `${baseUrl}health`;

        // Use n8n's httpRequest helper to perform a GET request
        const requestOptions: IHttpRequestOptions = {
            url: healthUrl,
            method: "GET",
            returnFullResponse: true,
        };

        if (DEBUG) {
            debugLog(
                "healthCheck",
                "Performing health check",
                itemIndex,
                healthUrl,
            );
        }

        try {
            // Perform the health check request
            const response =
                await executeFunctions.helpers.httpRequest(requestOptions);

            if (DEBUG)
                debugLog("healthCheck", "Health check successful", itemIndex);

            // Format the result directly without result wrapper
            addSuccessResult(
                returnData,
                {
                    status: "healthy",
                    details: response,
                },
                itemIndex,
            );
        } catch (error) {
            // Special error handling for health check - always return a result with status
            // rather than throwing an error, regardless of continueOnFail setting.
            // This is intentionally different from other operations because the purpose
            // of a health check is to report on status, not throw errors.
            if (DEBUG)
                debugLog(
                    "healthCheck",
                    "Health check failed",
                    itemIndex,
                    (error as Error).message,
                );

            // Add unhealthy status result using the utility function
            addSuccessResult(
                returnData,
                {
                    status: "unhealthy",
                    error: (error as Error).message,
                    details: (error as Error).message,
                },
                itemIndex,
            );
        }

        if (DEBUG)
            debugLog(
                "healthCheck",
                `Completed, returning ${returnData.length} items`,
                itemIndex,
            );
        return returnData;
    },
};
