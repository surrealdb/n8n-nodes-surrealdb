import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Delete Field" operation
 * This operation removes a field from a table
 */
export const deleteFieldOperation: IOperationHandler = {
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
			const fieldName = executeFunctions.getNodeParameter('fieldName', itemIndex) as string;
			
			// Validate required fields
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			validateRequiredField(executeFunctions, fieldName, 'Field Name', itemIndex);
			
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
			
			// Build the query to delete the field
			const query = `REMOVE FIELD ${fieldName} ON TABLE ${table};`;
			
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log query
				console.log('DEBUG - Delete Field query:', preparedQuery);
			}
			
			// Execute the query
			const result = await client.query(preparedQuery);
			
			if (DEBUG) {
				// DEBUG: Log raw result
				console.log('DEBUG - Raw query result:', JSON.stringify(result));
			}
			
			// Add the result to the returnData
			returnData.push({
				json: {
					success: true,
					field: fieldName,
					table,
					message: `Field ${fieldName} has been deleted from table ${table}`
				},
				pairedItem: { item: itemIndex },
			});
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: itemIndex },
				});
			} else {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error deleting field: ${error.message}`,
					{ itemIndex }
				);
			}
		}
		
		return returnData;
	},
};