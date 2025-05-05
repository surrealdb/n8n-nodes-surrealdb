import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, validateRequiredField, cleanTableName } from '../../../GenericFunctions';
import { addErrorResult, debugLog } from '../../../utilities';
import type { IOperationHandler } from '../../../types/operation.types';
import type { ISurrealCredentials } from '../../../types/surrealDb.types';

// Set to false to disable debug logging
const DEBUG = false;

/**
 * Implementation of the "Delete Table" operation
 * This operation completely removes a table from the database
 */
export const deleteTableOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];

		try {
			// Get parameters
			let table = executeFunctions.getNodeParameter('table', itemIndex) as string;
			validateRequiredField(executeFunctions, table, 'Table', itemIndex);

			// Clean and standardize the table name
			table = cleanTableName(table);

			// Get options
			const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;

			// Get credentials
			const credentials = await executeFunctions.getCredentials('surrealDbApi');

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

			// Build the query to remove the table
			const query = `REMOVE TABLE ${table}`;
			const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

			if (DEBUG) {
				debugLog('deleteTable', 'Query', itemIndex, preparedQuery);
			}

			// Execute the query
			const result = await client.query(preparedQuery);

			if (DEBUG) {
				debugLog('deleteTable', 'Raw query result', itemIndex, JSON.stringify(result));
			}

			// Return the raw SurrealDB response directly without modification
			// For DELETE TABLE operations, SurrealDB typically returns [null]
			returnData.push({
				json: result[0] as unknown as IDataObject,
				pairedItem: { item: itemIndex },
			});

		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				// Use the standard error handling utility
				addErrorResult(returnData, error, itemIndex);
			} else {
				throw error;
			}
		}

		return returnData;
	},
};