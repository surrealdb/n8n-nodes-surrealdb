import type { IExecuteFunctions, INodeExecutionData, IHttpRequestOptions } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery } from '../../../GenericFunctions';
import { debugLog, addSuccessResult } from '../../../utilities';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Version operation handler for System resource
 */
export const versionOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		if (DEBUG) debugLog('version', 'Starting operation', itemIndex);
			// Get the credentials from the client (they're already validated and resolved)
		const credentials = await executeFunctions.getCredentials('surrealDbApi');
		const nodeOptions = executeFunctions.getNodeParameter('options', itemIndex, {}) as any;
		const nodeNamespace = (nodeOptions.namespace as string)?.trim() || '';
		const nodeDatabase = (nodeOptions.database as string)?.trim() || '';

		const resolvedCredentials = {
			connectionString: credentials.connectionString as string,
			authentication: credentials.authentication as 'Root' | 'Namespace' | 'Database',
			username: credentials.username as string,
			password: credentials.password as string,
			namespace: nodeNamespace || (credentials.namespace as string),
			database: nodeDatabase || (credentials.database as string),
		} as ISurrealCredentials;

		let version = 'unknown';
		let details = '';

		// First, attempt to get version using INFO FOR SERVER query
		try {
			// Prepare the query based on authentication type
			const infoQuery = prepareSurrealQuery('INFO FOR SERVER', resolvedCredentials);
			const result = await client.query(infoQuery);

			// Parse the version from the result
			if (Array.isArray(result) && result.length > 0 && result[0]) {
				const serverInfo = result[0];
				if (typeof serverInfo === 'object' && serverInfo !== null) {
					// Extract version from the server info
					// The exact structure depends on SurrealDB's response format
					version = (serverInfo as any).version || 'unknown';
				}
			}
		} catch (queryError) {
			// If the query fails, use the /version endpoint as a fallback
			try {
				// Get the base URL from the connection string
				// Remove /rpc if it exists
				let baseUrl = resolvedCredentials.connectionString;
				if (baseUrl.endsWith('/rpc')) {
					baseUrl = baseUrl.slice(0, -4);
				}

				// Ensure the URL ends with a slash
				if (!baseUrl.endsWith('/')) {
					baseUrl += '/';
				}

				// Create the version URL
				const versionUrl = `${baseUrl}version`;

				// Use n8n's httpRequest helper to perform a GET request
				const requestOptions: IHttpRequestOptions = {
					url: versionUrl,
					method: 'GET',
				};

				// Perform the version request
				const response = await executeFunctions.helpers.httpRequest(requestOptions);

				// Extract version from response
				if (response && typeof response === 'string') {
					version = response.trim();
				} else if (response && typeof response === 'object') {
					version = (response as any).version || 'unknown';
				}
			} catch (httpError) {
				// If both methods fail, set details to the error message
				details = `Failed to retrieve version: ${(queryError as Error).message}, ${(httpError as Error).message}`;
			}
		}

		// Format the result using the utility function
		const returnData: INodeExecutionData[] = [];
		addSuccessResult(returnData, {
			version,
			details,
		}, itemIndex);
		return returnData;
	},
};