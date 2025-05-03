import type { IExecuteFunctions, INodeExecutionData, IHttpRequestOptions } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';
import type { Surreal } from 'surrealdb';

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
			// Do not throw an error on failure, just return unhealthy status
			return [{
				json: {
					status: 'unhealthy',
					details: (error as Error).message,
				},
				pairedItem: { item: itemIndex },
			}];
		}
	},
};