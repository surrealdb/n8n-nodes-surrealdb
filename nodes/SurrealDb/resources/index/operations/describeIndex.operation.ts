import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField, buildCredentialsObject } from '../../../GenericFunctions';
import { debugLog, addSuccessResult } from '../../../utilities';
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
			
			// Add the detailed index information to the returnData using the utility function
			addSuccessResult(returnData, {
				table,
				name: indexName,
				isBuilding,
				...(buildingProgress && { buildingProgress }),
				details: indexInfo,
				message: `Retrieved details for index ${indexName} on table ${table}`
			}, itemIndex);
		} else {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Unable to retrieve information for index ${indexName} on table ${table}`,
				{ itemIndex }
			);
		}
		
		return returnData;
	},
};