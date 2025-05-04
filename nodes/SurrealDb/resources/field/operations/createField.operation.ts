import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField } from '../../../GenericFunctions';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Create Field" operation
 * This operation creates a new field on a table
 */
export const createFieldOperation: IOperationHandler = {
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
			const fieldMode = executeFunctions.getNodeParameter('fieldMode', itemIndex) as string;
			let fieldType = executeFunctions.getNodeParameter('fieldType', itemIndex) as string;
			
			// Validate required fields
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);
			validateRequiredField(executeFunctions, fieldName, 'Field Name', itemIndex);
			
			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;
			
			// Handle record table type if field type is record
			if (fieldType === 'record') {
				const recordTableType = executeFunctions.getNodeParameter('recordTableType', itemIndex, '') as string;
				if (recordTableType) {
					fieldType = `record<${recordTableType}>`;
				}
			}
			
			// Handle array type
			if (options.isArray === true) {
				fieldType = `array<${fieldType}>`;
			}
			
			// Handle optional type
			if (options.isOptional === true) {
				fieldType = `option<${fieldType}>`;
			}
			
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
			
			// Build the query to create a field
			let query = `DEFINE FIELD ${fieldName} ON TABLE ${table} TYPE ${fieldType}`;
			
			// Add computation if it's a computed field
			if (fieldMode === 'computed') {
				const computeExpression = executeFunctions.getNodeParameter('computeExpression', itemIndex, '') as string;
				validateRequiredField(executeFunctions, computeExpression, 'Computation Expression', itemIndex);
				query += ` VALUE ${computeExpression}`;
			}
			// Add default value if provided and not a computed field
			else if (options.defaultValue) {
				let defaultValue = options.defaultValue as string;
				
				// Only add quotes for string types if not already quoted and not a SurrealQL function
				if (
					(fieldType === 'string' || fieldType.includes('string')) && 
					typeof defaultValue === 'string' &&
					!defaultValue.includes('::') && 
					!defaultValue.includes('(') &&
					!defaultValue.startsWith('"') && 
					!defaultValue.startsWith("'")
				) {
					defaultValue = `"${defaultValue}"`;
				}
				
				query += ` DEFAULT ${defaultValue}`;
			}
			
			// Add flexible property if enabled
			if (options.isFlexible === true) {
				query += ` FLEXIBLE`;
			}
			
			// Add readonly property if enabled
			if (options.isReadOnly === true) {
				query += ` READONLY`;
			}
			
			// Add assertion if provided
			if (options.assertion) {
				query += ` ASSERT ${options.assertion}`;
			}
			
			// End the query
			query += ';';
			
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);
			
			if (DEBUG) {
				// DEBUG: Log query
				console.log('DEBUG - Create Field query:', preparedQuery);
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
					type: fieldType,
					mode: fieldMode,
					flexible: options.isFlexible === true,
					readonly: options.isReadOnly === true,
					message: `Field ${fieldName} of type ${fieldType} created on table ${table}`
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
					`Error creating field: ${error.message}`,
					{ itemIndex }
				);
			}
		}
		
		return returnData;
	},
};