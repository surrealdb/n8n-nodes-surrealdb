import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Describe Index" operation
 * This operation retrieves detailed information about a specific index
 */
export const describeIndexOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];
		
		// Process each item
		for (let i = 0; i < items.length; i++) {
			try {
				// Get credentials
				const credentials = await executeFunctions.getCredentials('surrealDbApi');
				
				// Get parameters
				const table = executeFunctions.getNodeParameter('table', i) as string;
				const indexName = executeFunctions.getNodeParameter('indexName', i) as string;
				
				// Validate required fields
				validateRequiredField(executeFunctions, table, 'Table', i);
				validateRequiredField(executeFunctions, indexName, 'Index Name', i);
				
				// Get options
				const options = executeFunctions.getNodeParameter('options', i, {}) as IDataObject;
				
				// Get namespace/database overrides
				const nodeNamespace = (options.namespace as string)?.trim() || '';
				const nodeDatabase = (options.database as string)?.trim() || '';
				
				// Build the resolved credentials object
				const resolvedCredentials: ISurrealCredentials = {
					connectionString: credentials.connectionString as string,
					authentication: credentials.authentication as 'Root' | 'Namespace' | 'Database',
					username: credentials.username as string,
					password: credentials.password as string,
					namespace: nodeNamespace || (credentials.namespace as string),
					database: nodeDatabase || (credentials.database as string),
				};
				
				// Build the query to get index information
				const query = `INFO FOR INDEX ${indexName} ON TABLE ${table};`;
				
				const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
				
				if (DEBUG) {
					// DEBUG: Log query
					console.log('DEBUG - Describe Index query:', preparedQuery);
				}
				
				// Execute the query
				const result = await client.query(preparedQuery);
				
				if (DEBUG) {
					// DEBUG: Log raw result
					console.log('DEBUG - Raw query result:', JSON.stringify(result));
				}
				
				// Process the result
				if (Array.isArray(result) && result.length > 0) {
					const indexInfo = result[0];
					
					// Check if the index is being built (for concurrent index creation)
					const buildingStatus = indexInfo.building ? indexInfo.building.status : null;
					const isBuilding = buildingStatus !== null && buildingStatus !== 'ready';
					
					// Building progress details
					let buildingProgress = null;
					if (isBuilding && indexInfo.building) {
						buildingProgress = {
							status: indexInfo.building.status,
							initial: indexInfo.building.initial || 0,
							pending: indexInfo.building.pending || 0,
							updated: indexInfo.building.updated || 0,
						};
					}
					
					// Add the detailed index information to the returnData
					returnData.push({
						json: {
							success: true,
							table,
							name: indexName,
							isBuilding,
							...(buildingProgress && { buildingProgress }),
							details: indexInfo,
							message: `Retrieved details for index ${indexName} on table ${table}`
						},
						pairedItem: { item: i },
					});
				} else {
					throw new Error(`Unable to retrieve information for index ${indexName} on table ${table}`);
				}
			} catch (error) {
				if (executeFunctions.continueOnFail()) {
					returnData.push({
						json: { 
							success: false,
							error: error.message,
							index: executeFunctions.getNodeParameter('indexName', i) as string,
							table: executeFunctions.getNodeParameter('table', i) as string,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error describing index: ${error.message}`,
					{ itemIndex: i }
				);
			}
		}
		
		return returnData;
	},
};