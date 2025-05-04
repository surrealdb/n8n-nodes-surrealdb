import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "List Indexes" operation
 * This operation retrieves all index definitions for a table
 */
export const listIndexesOperation: IOperationHandler = {
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
			
			try {
				// Build the query to get table definition which includes indexes
				const query = `INFO FOR TABLE ${table};`;
				
				// Prepare query for the specific authentication type
				const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
				
				if (DEBUG) {
					// DEBUG: Log query
					console.log('DEBUG - List Indexes query:', preparedQuery);
				}
				
				// Execute the query
				const result = await client.query(preparedQuery);
				
				if (DEBUG) {
					// DEBUG: Log raw result
					console.log('DEBUG - Raw query result:', JSON.stringify(result));
				}
				
				// Check if the result contains an error
				const errorResult = Array.isArray(result) && result.length > 0 && result[0] && typeof result[0] === 'object' && 'error' in result[0];
				
				if (errorResult) {
					// Use NodeOperationError for SurrealDB query errors
					throw new NodeOperationError(
						executeFunctions.getNode(),
						`Error listing indexes: ${String(result[0].error)}`,
						{ itemIndex }
					);
				}
				
				// Process the result
				if (Array.isArray(result) && result.length > 0) {
					const tableInfo = result[0];
					
					if (tableInfo && tableInfo.indexes && typeof tableInfo.indexes === 'object') {
						// Convert the indexes object to a more user-friendly format
						const indexesArray = Object.entries(tableInfo.indexes).map(([indexName, definition]) => {
							// Process the index definition to extract type, fields, etc.
							const definitionStr = definition as string;
							
							// Determine if index is unique
							const isUnique = definitionStr.includes(' UNIQUE');
							
							// Determine index type (SEARCH, MTREE, or standard)
							let indexType = 'standard';
							if (definitionStr.includes(' SEARCH ')) {
								indexType = 'search';
							} else if (definitionStr.includes(' MTREE ')) {
								indexType = 'mtree';
							}
							
							// Extract fields from the definition
							const fieldsMatch = definitionStr.match(/FIELDS\s+([^(UNIQUE|SEARCH|MTREE|;)]+)/i);
							const fieldsStr = fieldsMatch ? fieldsMatch[1].trim() : '';
							const fields = fieldsStr.split(/,\s*/).map(field => field.trim());
							
							// Extract vector dimension if it's an MTREE index
							let dimension = null;
							if (indexType === 'mtree') {
								const dimensionMatch = definitionStr.match(/DIMENSION\s+(\d+)/i);
								dimension = dimensionMatch ? parseInt(dimensionMatch[1], 10) : null;
							}
							
							// Extract distance function if it's an MTREE index
							let distanceFunction = null;
							if (indexType === 'mtree') {
								const distMatch = definitionStr.match(/DIST\s+(\w+)/i);
								distanceFunction = distMatch ? distMatch[1].toLowerCase() : null;
							}
							
							// Extract whether it has highlights if it's a SEARCH index
							const hasHighlights = indexType === 'search' && definitionStr.includes(' HIGHLIGHTS');
							
							// Extract the analyzer if it's a SEARCH index
							let analyzer = null;
							if (indexType === 'search') {
								const analyzerMatch = definitionStr.match(/ANALYZER\s+(\w+)/i);
								analyzer = analyzerMatch ? analyzerMatch[1] : null;
							}
							
							return {
								name: indexName,
								type: indexType,
								definition: definitionStr,
								isUnique,
								fields,
								dimension,
								distanceFunction,
								hasHighlights,
								analyzer,
							};
						});
						
						// Add each index as a separate item in the returnData for better n8n integration
						for (const index of indexesArray) {
							returnData.push({
								json: {
									table,
									name: index.name,
									type: index.type,
									definition: index.definition,
									isUnique: index.isUnique,
									fields: index.fields,
									// Only include additional properties if relevant
									...(index.dimension !== null && { dimension: index.dimension }),
									...(index.distanceFunction !== null && { distanceFunction: index.distanceFunction }),
									...(index.hasHighlights !== null && { hasHighlights: index.hasHighlights }),
									...(index.analyzer !== null && { analyzer: index.analyzer }),
									totalIndexes: indexesArray.length
								},
								pairedItem: { item: itemIndex },
							});
						}
						
						// If no indexes were found, return a single item indicating this
						if (indexesArray.length === 0) {
							returnData.push({
								json: {
									table,
									message: `No indexes found in table ${table}`,
									totalIndexes: 0
								},
								pairedItem: { item: itemIndex },
							});
						}
					} else {
						// If indexes property is missing, table might not exist or has no indexes
						returnData.push({
							json: {
								table,
								message: `No indexes found in table ${table}`,
								totalIndexes: 0
							},
							pairedItem: { item: itemIndex },
						});
					}
				} else {
					throw new NodeOperationError(
						executeFunctions.getNode(),
						`Unable to retrieve information for table ${table}`,
						{ itemIndex }
					);
				}
			} catch (error) {
				// Handle query preparation and execution errors
				if (error.name === 'NodeOperationError') {
					throw error; // Re-throw NodeOperationErrors as they already have the right format
				} else {
					throw new NodeOperationError(
						executeFunctions.getNode(),
						`Error retrieving index information: ${error.message}`,
						{ itemIndex }
					);
				}
			}
		} catch (error) {
			// Check if executeFunctions.continueOnFail() is true
			if (executeFunctions.continueOnFail()) {
				// Add error to returnData instead of throwing
				returnData.push({
					json: {
						error: error.message,
						table: executeFunctions.getNodeParameter('table', itemIndex, ''),
					},
					pairedItem: { item: itemIndex },
				});
			} else {
				// If continueOnFail is false, re-throw the error
				throw error;
			}
		}
		
		return returnData;
	},
};