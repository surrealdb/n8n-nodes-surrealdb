import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import type { IOperationHandler } from '../../../types/operation.types';
import type { Surreal } from 'surrealdb';
import { validateRequiredField, validateJSON, prepareSurrealQuery } from '../../../GenericFunctions';
import { formatSingleResult, formatArrayResult } from '../../../utilities';

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
		// Get parameters
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
			throw new Error(`Parameters must be a JSON string or a JSON object, received type: ${typeof parametersInput}`);
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
		
		// Process results
		let returnData: INodeExecutionData[] = [];
		
		// The result is an array of arrays, where each array contains the results of a statement
		if (Array.isArray(result)) {
			// Process each result set, filtering out null values
			for (const resultSet of result.filter(item => item !== null)) {
				if (Array.isArray(resultSet)) {
					// For array results, return each item as a separate n8n item
					const formattedResults = formatArrayResult(resultSet);
					for (const formattedResult of formattedResults) {
						returnData.push({
							...formattedResult,
							pairedItem: { item: itemIndex },
						});
					}
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
		
		return returnData;
	},
};