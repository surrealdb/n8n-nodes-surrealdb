import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Create Index" operation
 * This operation creates a new index on a table
 */
export const createIndexOperation: IOperationHandler = {
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
				const indexFields = executeFunctions.getNodeParameter('indexFields', i) as string;
				const indexType = executeFunctions.getNodeParameter('indexType', i) as string;
				
				// Validate required fields
				validateRequiredField(executeFunctions, table, 'Table', i);
				validateRequiredField(executeFunctions, indexName, 'Index Name', i);
				validateRequiredField(executeFunctions, indexFields, 'Index Fields', i);
				
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
				
				// Build the query to create an index
				let query = 'DEFINE INDEX';
				
				// Add IF NOT EXISTS clause if specified
				if (options.ifNotExists === true) {
					query += ' IF NOT EXISTS';
				}
				
				// Add OVERWRITE clause if specified
				if (options.overwrite === true) {
					query += ' OVERWRITE';
				}
				
				// Add index name and table
				query += ` ${indexName} ON TABLE ${table}`;
				
				// Add fields
				// Trim and split by comma, then remove any empty entries and trim each field
				const fieldsList = indexFields
					.split(',')
					.map(field => field.trim())
					.filter(field => field !== '');
				
				query += ` FIELDS ${fieldsList.join(', ')}`;
				
				// Add UNIQUE constraint if specified
				if (options.isUnique === true) {
					query += ' UNIQUE';
				}
				
				// Handle specific index types
				if (indexType === 'search') {
					query += ' SEARCH';
					
					// Add analyzer if provided
					const ftsAnalyzer = executeFunctions.getNodeParameter('ftsAnalyzer', i, '') as string;
					if (ftsAnalyzer) {
						query += ` ANALYZER ${ftsAnalyzer}`;
					}
					
					// Add BM25 for search ranking
					query += ' BM25';
					
					// Add HIGHLIGHTS if enabled
					const enableHighlights = executeFunctions.getNodeParameter('enableHighlights', i, false) as boolean;
					if (enableHighlights) {
						query += ' HIGHLIGHTS';
					}
				} 
				else if (indexType === 'mtree') {
					query += ' MTREE';
					
					// Add dimension for vector index
					const vectorDimension = executeFunctions.getNodeParameter('vectorDimension', i, 0) as number;
					if (vectorDimension > 0) {
						query += ` DIMENSION ${vectorDimension}`;
					} else {
						throw new NodeOperationError(
							executeFunctions.getNode(),
							'Vector dimension must be specified for MTREE indexes',
							{ itemIndex: i }
						);
					}
					
					// Add vector data type if specified
					const vectorType = options.vectorType as string;
					if (vectorType) {
						query += ` TYPE ${vectorType}`;
					}
					
					// Add distance function
					const distanceFunction = executeFunctions.getNodeParameter('distanceFunction', i, 'euclidean') as string;
					query += ` DIST ${distanceFunction.toUpperCase()}`;
				}
				
				// Add CONCURRENTLY clause if specified
				if (options.concurrently === true) {
					query += ' CONCURRENTLY';
				}
				
				// End the query
				query += ';';
				
				try {
					// Prepare query for the specific authentication type
					const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
					
					if (DEBUG) {
						// DEBUG: Log query
						console.log('DEBUG - Create Index query:', preparedQuery);
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
							`Error creating index: ${String(result[0].error)}`,
							{ itemIndex: i }
						);
					}
					
					// No error, operation succeeded - return result WITHOUT success field
					returnData.push({
						json: {
							index: indexName,
							table,
							fields: fieldsList,
							type: indexType,
							unique: options.isUnique === true,
							message: `Index ${indexName} created on table ${table}`
						},
						pairedItem: { item: i },
					});
				} catch (error) {
					// Handle query preparation errors
					if (error.name === 'NodeOperationError') {
						throw error; // Re-throw NodeOperationErrors as they already have the right format
					} else {
						throw new NodeOperationError(
							executeFunctions.getNode(),
							`Error preparing or executing query: ${error.message}`,
							{ itemIndex: i }
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
						},
						pairedItem: { item: i },
					});
					continue;
				}
				// If continueOnFail is false, re-throw the error
				throw error;
			}
		}
		
		return returnData;
	},
};