import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField, buildCredentialsObject } from '../../../GenericFunctions';
import { debugLog } from '../../../utilities';
import type { IOperationHandler } from '../../../types/operation.types';

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
		
		try {
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get parameters
			const table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			const indexName = executeFunctions.getNodeParameter('indexName', itemIndex) as string;
			
			// Validate required fields
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			validateRequiredField(executeFunctions, indexName, 'Index Name', itemIndex);
			
			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
			
			// Build the resolved credentials object using utility function
			const resolvedCredentials = buildCredentialsObject(credentials, options);
			
			// Build the query to get index information
			const query = `INFO FOR INDEX ${indexName} ON TABLE ${table};`;
			
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log query
				debugLog('describeIndex', 'Prepared query', itemIndex, preparedQuery);
			}
			
			// Execute the query
			const result = await client.query(preparedQuery);
			
			if (DEBUG) {
				// DEBUG: Log raw result
				debugLog('describeIndex', 'Raw query result', itemIndex, JSON.stringify(result));
			}
			
			// Process the result
			if (Array.isArray(result) && result.length > 0) {
				const indexInfo = result[0];
				
				// Return the index information directly
				returnData.push({
					json: indexInfo,
					pairedItem: { item: itemIndex },
				});
			} else {
				throw new Error(`Unable to retrieve information for index ${indexName} on table ${table}`);
			}
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				returnData.push({
					json: { 
						error: error.message 
					},
					pairedItem: { item: itemIndex },
				});
			} else {
				if (error.name === 'NodeOperationError') {
					throw error;
				}
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error getting index details: ${error.message}`,
					{ itemIndex }
				);
			}
		}
		
		return returnData;
	},
};