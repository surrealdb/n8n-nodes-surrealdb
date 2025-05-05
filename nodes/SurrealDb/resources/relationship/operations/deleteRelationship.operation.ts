import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { prepareSurrealQuery, buildCredentialsObject } from '../../../GenericFunctions';
import { debugLog } from '../../../utilities';
import type { IOperationHandler } from '../../../types/operation.types';

// Set to true to enable debug logging, false to disable
const DEBUG = false;

/**
 * Implementation of the "Delete Relationship" operation
 * This operation deletes a relationship between two records
 */
export const deleteRelationshipOperation: IOperationHandler = {
	async execute(
		client: Surreal,
		items: INodeExecutionData[],
		executeFunctions: IExecuteFunctions,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const returnData: INodeExecutionData[] = [];

		if (DEBUG) debugLog('deleteRelationship', 'Starting operation', itemIndex);

		// Get credentials
		const credentials = await executeFunctions.getCredentials('surrealDbApi');

		// Get parameters
		const fromRecordId = executeFunctions.getNodeParameter('fromRecordId', itemIndex, '') as string;
		const relationshipType = executeFunctions.getNodeParameter('relationshipType', itemIndex, '') as string;
		const toRecordId = executeFunctions.getNodeParameter('toRecordId', itemIndex, '') as string;

		// Ensure at least one parameter is provided
		if (!fromRecordId && !relationshipType && !toRecordId) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`At least one of From Record ID, Relationship Type, or To Record ID must be provided`,
				{ itemIndex }
			);
		}

		// Validate record IDs format if provided
		if (fromRecordId && !fromRecordId.includes(':')) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`From Record ID must be in the format "table:id" (e.g., person:john)`,
				{ itemIndex }
			);
		}

		if (toRecordId && !toRecordId.includes(':')) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`To Record ID must be in the format "table:id" (e.g., person:jane)`,
				{ itemIndex }
			);
		}

		// Get options
		const options = executeFunctions.getNodeParameter('options', itemIndex, {}) as IDataObject;

		// Build the resolved credentials object using the utility function
		const resolvedCredentials = buildCredentialsObject(credentials, options);

		// Build the DELETE statement
		const returnType = options.returnType ? ` RETURN ${options.returnType}` : '';
		let query = '';

		// Handle different combinations of parameters
		if (fromRecordId && relationshipType && toRecordId) {
			// All parameters provided - most specific case
			query = `DELETE ${fromRecordId}->${relationshipType} WHERE out = ${toRecordId}${returnType};`;
		} else if (fromRecordId && relationshipType) {
			// From Record ID and Relationship Type provided - delete all relationships of this type from this record
			query = `DELETE ${fromRecordId}->${relationshipType}${returnType};`;
		} else if (fromRecordId && toRecordId) {
			// From Record ID and To Record ID provided - delete all relationships between these records
			query = `DELETE ${fromRecordId}->?->? WHERE out = ${toRecordId}${returnType};`;
		} else if (relationshipType && toRecordId) {
			// Relationship Type and To Record ID provided - delete all relationships of this type to this record
			query = `DELETE FROM ${relationshipType} WHERE out = ${toRecordId}${returnType};`;
		} else if (fromRecordId) {
			// Only From Record ID provided - delete all relationships from this record
			query = `DELETE ${fromRecordId}->?${returnType};`;
		} else if (relationshipType) {
			// Only Relationship Type provided - delete all relationships of this type
			query = `DELETE FROM ${relationshipType}${returnType};`;
		} else if (toRecordId) {
			// Only To Record ID provided - delete all relationships to this record
			query = `DELETE FROM ? WHERE out = ${toRecordId}${returnType};`;
		}

		const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

		if (DEBUG) {
			// DEBUG: Log query
			debugLog('deleteRelationship', 'Prepared query', itemIndex, preparedQuery);
		}

		// Execute the query
		const result = await client.query(preparedQuery);

		if (DEBUG) {
			// DEBUG: Log raw result
			debugLog('deleteRelationship', 'Raw query result', itemIndex, JSON.stringify(result));
		}

		// Process the result
		if (Array.isArray(result) && result.length > 0) {
			const deleteResult = result[0];

			// Return the delete result
			if (Array.isArray(deleteResult)) {
				// Multiple relationships were deleted
				for (const relationship of deleteResult) {
					returnData.push({
						json: relationship,
						pairedItem: { item: itemIndex },
					});
				}
			} else if (deleteResult !== null) {
				// Single relationship was deleted
				returnData.push({
					json: deleteResult,
					pairedItem: { item: itemIndex },
				});
			} else {
				// No relationships were deleted
				returnData.push({
					json: {
						success: true,
						message: `No relationships of type '${relationshipType}' found between ${fromRecordId} and ${toRecordId}`
					},
					pairedItem: { item: itemIndex },
				});
			}
		} else {
			// Return an empty result if nothing was deleted
			let message = 'No relationships found';

			if (fromRecordId && relationshipType && toRecordId) {
				message = `No relationships of type '${relationshipType}' found between ${fromRecordId} and ${toRecordId}`;
			} else if (fromRecordId && relationshipType) {
				message = `No relationships of type '${relationshipType}' found from ${fromRecordId}`;
			} else if (fromRecordId && toRecordId) {
				message = `No relationships found between ${fromRecordId} and ${toRecordId}`;
			} else if (relationshipType && toRecordId) {
				message = `No relationships of type '${relationshipType}' found to ${toRecordId}`;
			} else if (fromRecordId) {
				message = `No relationships found from ${fromRecordId}`;
			} else if (relationshipType) {
				message = `No relationships of type '${relationshipType}' found`;
			} else if (toRecordId) {
				message = `No relationships found to ${toRecordId}`;
			}

			returnData.push({
				json: {
					success: true,
					message
				},
				pairedItem: { item: itemIndex },
			});
		}

		return returnData;
	},
};
