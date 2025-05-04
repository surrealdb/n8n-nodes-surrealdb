import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateJSON, prepareSurrealQuery } from '../../../GenericFunctions';
import { formatSingleResult, formatArrayResult, debugLog } from '../../../utilities';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Execute Query operation handler for Query resource
 */
export const executeQueryOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];

		try {
				if (DEBUG) debugLog('executeQuery', 'Starting operation', itemIndex);
			// Get parameters for the specific item
			const query = executeFunctions.getNodeParameter('query', itemIndex) as string;
			validateRequiredField(executeFunctions, query, 'Query', itemIndex);
			
			// Get parameters if provided
			const parametersInput = executeFunctions.getNodeParameter('parameters', itemIndex, {});
			
			// Process parameters based on type
			let parameters: any;
			if (typeof parametersInput === 'string') {
				// If it's a string, parse and validate as JSON
				parameters = validateJSON(executeFunctions, parametersInput, itemIndex);
			} else if (typeof parametersInput === 'object' && parametersInput !== null) {
				// If it's already an object, use it directly
				parameters = parametersInput;
			} else {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Parameters must be a JSON string or a JSON object, received type: ${typeof parametersInput}`,
					{ itemIndex }
				);
			}
			
			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
			const limit = options.limit as number;
			const start = options.start as number;
			
			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');
			
			// Get namespace/database overrides
			const nodeNamespace = (options.namespace as string)?.trim() || '';
			const nodeDatabase = (options.database as string)?.trim() || '';
			
			// Build the resolved credentials object
			const resolvedCredentials = {
				connectionString: credentials.connectionString as string,
				authentication: credentials.authentication as 'Root' | 'Namespace' | 'Database',
				username: credentials.username as string,
				password: credentials.password as string,
				namespace: nodeNamespace || (credentials.namespace as string),
				database: nodeDatabase || (credentials.database as string),
			};
			
			// Check if the query already contains LIMIT or START clauses
			const hasLimit = query.toUpperCase().includes('LIMIT');
			const hasStart = query.toUpperCase().includes('START');
			
			// Modify the query to add pagination if needed
			let finalQuery = query;
			if (limit !== undefined && !hasLimit) {
				finalQuery += ` LIMIT ${limit}`;
			}
			if (start !== undefined && !hasStart) {
				finalQuery += ` START ${start}`;
			}
			
			// Prepare the query based on authentication type
			finalQuery = prepareSurrealQuery(finalQuery, resolvedCredentials);
			
			// Execute the query
			const result = await client.query(finalQuery, parameters);
			
			// The result is an array of arrays, where each array contains the results of a statement
			if (Array.isArray(result)) {
				// Process each result set, filtering out null values
				for (const resultSet of result.filter(item => item !== null)) {
					if (Array.isArray(resultSet)) {
						// For array results, return each item as a separate n8n item
						// with pairedItem already set
						const formattedResults = formatArrayResult(resultSet, itemIndex);
						returnData.push(...formattedResults);
					} else {
						// For single results, use the formatSingleResult function
						const formattedResult = formatSingleResult(resultSet);
						returnData.push({
							...formattedResult,
							pairedItem: { item: itemIndex },
						});
					}
				}
			} else {
				// If the result is not an array, format it as a single result
				const formattedResult = formatSingleResult(result);
				returnData.push({
					...formattedResult,
					pairedItem: { item: itemIndex },
				});
			}
			
			// If no results were added for this item, add an empty result to maintain item mapping
			if (returnData.length === 0) {
				returnData.push({
					json: {},
					pairedItem: { item: itemIndex },
				});
			}
			
		} catch (error) {
			// Handle errors based on continueOnFail setting
			if (executeFunctions.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: itemIndex },
				});
			} else {
				// If continueOnFail is not enabled, re-throw the error
				throw error;
			}
		}
		
		return returnData;
	},
};