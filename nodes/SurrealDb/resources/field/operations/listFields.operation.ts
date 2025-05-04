import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "List Fields" operation
 * This operation retrieves all field definitions for a table
 */
export const listFieldsOperation: IOperationHandler = {
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
				
				// Validate required fields
				validateRequiredField(executeFunctions, table, 'Table', i);
				
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
				
				// Build the query to get table definition
				const query = `INFO FOR TABLE ${table};`;
				
				const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
				
				if (DEBUG) {
					// DEBUG: Log query
					console.log('DEBUG - List Fields query:', preparedQuery);
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
					
					if (tableInfo.fields && typeof tableInfo.fields === 'object') {
						// Convert the fields object to a more user-friendly format
						const fieldsArray = Object.entries(tableInfo.fields).map(([fieldName, definition]) => {
							// Process the field definition to extract type, constraints, etc.
							const definitionStr = definition as string;
							
							// Extract field type
							const typeMatch = definitionStr.match(/TYPE\s+(\S+)/i);
							const fieldType = typeMatch ? typeMatch[1] : 'unknown';
							
							// Check if field is computed (has VALUE keyword)
							const isComputed = definitionStr.includes(' VALUE ');
							
							// Check for READONLY attribute
							const isReadOnly = definitionStr.includes(' READONLY');
							
							// Check for FLEXIBLE attribute
							const isFlexible = definitionStr.includes(' FLEXIBLE');
							
							// Extract permissions
							const permissionsMatch = definitionStr.match(/PERMISSIONS\s+(\S+)/i);
							const permissions = permissionsMatch ? permissionsMatch[1] : 'unknown';
							
							return {
								name: fieldName,
								type: fieldType,
								definition: definitionStr,
								isComputed,
								isReadOnly,
								isFlexible,
								permissions,
							};
						});
						
						// Add each field as a separate item in the returnData for better n8n integration
						for (const field of fieldsArray) {
							returnData.push({
								json: {
									success: true,
									table,
									name: field.name,
									type: field.type,
									definition: field.definition,
									isComputed: field.isComputed,
									isReadOnly: field.isReadOnly,
									isFlexible: field.isFlexible,
									permissions: field.permissions,
									totalFields: fieldsArray.length
								},
								pairedItem: { item: i },
							});
						}
						
						// If no fields were found, return a single item indicating this
						if (fieldsArray.length === 0) {
							returnData.push({
								json: {
									success: true,
									table,
									message: `No fields found in table ${table}`,
									totalFields: 0
								},
								pairedItem: { item: i },
							});
						}
					} else {
						throw new Error(`No fields found for table ${table}`);
					}
				} else {
					throw new Error(`Unable to retrieve information for table ${table}`);
				}
			} catch (error) {
				if (executeFunctions.continueOnFail()) {
					returnData.push({
						json: { 
							success: false,
							error: error.message,
							table: executeFunctions.getNodeParameter('table', i) as string,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(
					executeFunctions.getNode(),
					`Error listing fields: ${error.message}`,
					{ itemIndex: i }
				);
			}
		}
		
		return returnData;
	},
};