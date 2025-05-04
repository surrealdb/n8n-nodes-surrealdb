import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
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
		try {
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
			
			// Check for errors in the result
			if (result === null || result === undefined) {
				throw new NodeOperationError(
					executeFunctions.getNode(),
					'Query execution failed: No result returned',
					{ itemIndex }
				);
			}
			
			// Check for specific error patterns in the response
			if (Array.isArray(result)) {
				// Check if we have completely empty results (could indicate syntax error)
				if (result.length === 0 || 
					(result.length === 1 && typeof result[0] === 'object' && Object.keys(result[0]).length === 0)) {
					// This could be an invalid query - let's check by examining the original query text
					if (!/^(SELECT|CREATE|DELETE|INSERT|RELATE|UPDATE|DEFINE|REMOVE|INFO|LET|BEGIN|CANCEL|COMMIT|IFELSE|FOR|USE)/i.test(query.trim())) {
						throw new NodeOperationError(
							executeFunctions.getNode(),
							`Invalid query syntax: "${query}" is not a valid SurrealQL query. Query returned empty result.`,
							{ itemIndex }
						);
					}
				}
				
				// Check each result item for errors
				for (let i = 0; i < result.length; i++) {
					const resultSet = result[i];
					
					// SurrealDB can return errors in various formats
					if (resultSet && typeof resultSet === 'object') {
						// Check status error format
						if ('status' in resultSet && resultSet.status === 'ERR') {
							throw new NodeOperationError(
								executeFunctions.getNode(),
								`Query execution error: ${resultSet.detail || 'Unknown error'}`,
								{ itemIndex }
							);
						}
						
						// Check error property format
						if ('error' in resultSet && resultSet.error) {
							throw new NodeOperationError(
								executeFunctions.getNode(),
								`Query execution error: ${resultSet.error}`,
								{ itemIndex }
							);
						}
						
						// Check code error format
						if ('code' in resultSet && 'details' in resultSet && resultSet.code !== 200) {
							throw new NodeOperationError(
								executeFunctions.getNode(),
								`Query execution error (${resultSet.code}): ${resultSet.details || 'Unknown error'}`,
								{ itemIndex }
							);
						}
					}
				}
			}
			
			// Process results
			let returnData: INodeExecutionData[] = [];
			
			// The result is an array of arrays, where each array contains the results of a statement
			if (Array.isArray(result)) {
				// Check for completely empty result with no data
				if (result.length === 1 && typeof result[0] === 'object' && Object.keys(result[0]).length === 0) {
					return [{
						json: { 
							result: null,
							message: 'Query executed but returned an empty result set. The query may be valid but returned no data, or it may be a statement that doesn\'t return data.'
						},
						pairedItem: { item: itemIndex },
					}];
				}
				
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
			
			// If no results were processed, return an empty result indication
			if (returnData.length === 0) {
				returnData = [{
					json: { 
						result: null,
						message: 'Query executed successfully but returned no results'
					},
					pairedItem: { item: itemIndex },
				}];
			}
			
			return returnData;
			
		} catch (error) {
			// Handle errors based on continueOnFail setting
			if (executeFunctions.continueOnFail()) {
				return [{
					json: { error: error.message },
					pairedItem: { item: itemIndex },
				}];
			}
			
			// If continueOnFail is not enabled, re-throw the error
			throw error;
		}
	},
};