import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Get Table" operation
 * This operation retrieves the definition details of a table
 */
export const getTableOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];
		
		try {
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get parameters
			const table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			
			// Validate required fields
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			
			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
			
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
			
			// Build the query to get table definition
			const query = `INFO FOR TABLE ${table};`;
			
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log query
				console.log('DEBUG - Get Table query:', preparedQuery);
			}
			
			// Execute the query
			const result = await client.query(preparedQuery);
			
			if (DEBUG) {
				// DEBUG: Log raw result
				console.log('DEBUG - Raw query result:', JSON.stringify(result));
			}
			
			// Process the result
			if (Array.isArray(result) && result.length > 0) {
				const tableInfo = result[0];
				
				// Add the result to the returnData
				returnData.push({
					json: {
						success: true,
						table,
						definition: tableInfo,
						message: `Retrieved definition for table ${table}`
					},
					pairedItem: { item: itemIndex },
				});
			} else {
				throw new Error(`Unable to retrieve information for table ${table}`);
			}
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				returnData.push({
					json: { 
						success: false,
						error: error.message,
						table: executeFunctions.getNodeParameter('table', itemIndex) as string,
					},
					pairedItem: { item: itemIndex },
				});
			} else {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error getting table definition: ${error.message}`,
					{ itemIndex }
				);
			}
		}
		
		return returnData;
	},
};