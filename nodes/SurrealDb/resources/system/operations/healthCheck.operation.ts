import type { IExecuteFunctions, INodeExecutionData, IHttpRequestOptions } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';
import type { Surreal } from 'surrealdb';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

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

		// Create the health check URL
		const healthUrl = `${baseUrl}health`;

		// Use n8n's httpRequest helper to perform a GET request
		const requestOptions: IHttpRequestOptions = {
			url: healthUrl,
			method: 'GET',
			returnFullResponse: true,
		};
		
		if (DEBUG) {
			console.log(`DEBUG (healthCheck) - Performing health check for item ${itemIndex}:`, healthUrl);
		}

		try {
			// Perform the health check request
			const response = await executeFunctions.helpers.httpRequest(requestOptions);

			// Format the result
			return [{
				json: {
					status: 'healthy',
					details: response,
				},
				pairedItem: { item: itemIndex },
			}];
		} catch (error) {
			// Special error handling for health check - always return a result with status
			// rather than throwing an error, regardless of continueOnFail setting.
			// This is intentionally different from other operations because the purpose
			// of a health check is to report on status, not throw errors.
			return [{
				json: {
					status: 'unhealthy',
					error: (error as Error).message, // Add standard 'error' property
					details: (error as Error).message,
				},
				pairedItem: { item: itemIndex },
			}];
		}
	},
};