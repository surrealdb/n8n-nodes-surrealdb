import get from 'lodash/get';
import set from 'lodash/set';
import { Surreal } from 'surrealdb';
import { NodeOperationError } from 'n8n-workflow';
import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';

import type {
	ISurrealCredentials,
	ISurrealCredentialsType,
	ISurrealParametricCredentials,
} from './surrealDb.types';

/**
 * Validate JSON input
 * @param self The execute functions instance
 * @param input The JSON string to validate
 * @param itemIndex The index of the current item
 * @returns The parsed JSON object
 * @throws NodeOperationError if the input is not valid JSON
 */
export function validateJSON(self: IExecuteFunctions, input: string, itemIndex: number): any {
	try {
		return JSON.parse(input);
	} catch (error) {
		throw new NodeOperationError(self.getNode(), 'Invalid JSON provided', { itemIndex });
	}
}

/**
 * Validate required field
 * @param self The execute functions instance
 * @param field The field value to validate
 * @param fieldName The name of the field for error messages
 * @param itemIndex The index of the current item
 * @throws NodeOperationError if the field is undefined or empty
 */
export function validateRequiredField(
	self: IExecuteFunctions,
	field: any,
	fieldName: string,
	itemIndex: number,
): void {
	if (field === undefined || field === '') {
		throw new NodeOperationError(self.getNode(), `${fieldName} is required`, { itemIndex });
	}
}

/**
 * Validate numeric field
 * @param self The execute functions instance
 * @param field The field value to validate
 * @param fieldName The name of the field for error messages
 * @param itemIndex The index of the current item
 * @returns The validated number
 * @throws NodeOperationError if the field is not a valid positive number
 */
export function validateNumericField(
	self: IExecuteFunctions,
	field: any,
	fieldName: string,
	itemIndex: number,
): number {
	const num = Number(field);
	if (isNaN(num) || num < 0) {
		throw new NodeOperationError(self.getNode(), `${fieldName} must be a positive number`, {
			itemIndex,
		});
	}
	return num;
}

/**
 * Validate array field
 * @param self The execute functions instance
 * @param field The field value to validate
 * @param fieldName The name of the field for error messages
 * @param itemIndex The index of the current item
 * @throws NodeOperationError if the field is not an array
 */
export function validateArrayField(
	self: IExecuteFunctions,
	field: any,
	fieldName: string,
	itemIndex: number,
): void {
	if (!Array.isArray(field)) {
		throw new NodeOperationError(self.getNode(), `${fieldName} must be an array`, { itemIndex });
	}
}

/**
 * Standard way of building the SurrealDB connection string, unless overridden with a provided string
 *
 * @param {ICredentialDataDecryptedObject} credentials SurrealDB credentials to use, unless conn string is overridden
 */
export function buildParameterizedConnString(credentials: ISurrealParametricCredentials): string {
	return `${credentials.protocol}://${credentials.host}:${credentials.port}`;
}

/**
 * Build SurrealDB connection string and resolve database name.
 * If a connection string override value is provided, that will be used in place of individual args
 *
 * @param {ICredentialDataDecryptedObject} credentials raw/input SurrealDB credentials to use
 */
export function buildSurrealConnectionParams(
	self: IExecuteFunctions,
	credentials: ISurrealCredentialsType,
): ISurrealCredentials {
	const sanitizedDbName =
		credentials.database && credentials.database.trim().length > 0
			? credentials.database.trim()
			: '';
	
	const sanitizedNamespace =
		credentials.namespace && credentials.namespace.trim().length > 0
			? credentials.namespace.trim()
			: '';

	if (credentials.configurationType === 'connectionString') {
		if (credentials.connectionString && credentials.connectionString.trim().length > 0) {
			return {
				connectionString: credentials.connectionString.trim(),
				namespace: sanitizedNamespace,
				database: sanitizedDbName,
				user: credentials.user,
				password: credentials.password,
			};
		} else {
			throw new NodeOperationError(
				self.getNode(),
				'Cannot override credentials: valid SurrealDB connection string not provided ',
			);
		}
	} else {
		return {
			connectionString: buildParameterizedConnString(credentials),
			namespace: sanitizedNamespace,
			database: sanitizedDbName,
			user: credentials.user,
			password: credentials.password,
		};
	}
}

/**
 * Verify credentials. If ok, build SurrealDB connection string and resolve database name.
 *
 * @param {ICredentialDataDecryptedObject} credentials raw/input SurrealDB credentials to use
 */
export function validateAndResolveSurrealCredentials(
	self: IExecuteFunctions,
	credentials?: ICredentialDataDecryptedObject,
): ISurrealCredentials {
	if (credentials === undefined) {
		throw new NodeOperationError(self.getNode(), 'No credentials got returned!');
	} else {
		return buildSurrealConnectionParams(self, credentials as unknown as ISurrealCredentialsType);
	}
}

export function prepareItems(
	items: INodeExecutionData[],
	fields: string[],
	updateKey = '',
	useDotNotation = false,
	dateFields: string[] = [],
) {
	let data = items;

	if (updateKey) {
		if (!fields.includes(updateKey)) {
			fields.push(updateKey);
		}
		data = items.filter((item) => item.json[updateKey] !== undefined);
	}

	const preparedItems = data.map(({ json }) => {
		const updateItem: IDataObject = {};

		for (const field of fields) {
			let fieldData;

			if (useDotNotation) {
				fieldData = get(json, field, null);
			} else {
				fieldData = json[field] !== undefined ? json[field] : null;
			}

			if (fieldData && dateFields.includes(field)) {
				fieldData = new Date(fieldData as string);
			}

			if (useDotNotation) {
				set(updateItem, field, fieldData);
			} else {
				updateItem[field] = fieldData;
			}
		}

		return updateItem;
	});

	return preparedItems;
}

export function prepareFields(fields: string) {
	return fields
		.split(',')
		.map((field) => field.trim())
		.filter((field) => !!field);
}

export async function connectSurrealClient(
	connectionString: string,
	namespace: string,
	database: string,
	user: string,
	password: string,
) {
	// For cloud instances, we need to ensure we're using the correct endpoint format
	// SurrealDB cloud requires authentication at the base URL, not at the /rpc endpoint
	const isCloudInstance = connectionString.includes('surreal.cloud');
	
	// Only add /rpc for non-cloud instances or if explicitly specified
	if (!isCloudInstance && !connectionString.endsWith('/rpc')) {
		connectionString = connectionString.endsWith('/') ? `${connectionString}rpc` : `${connectionString}/rpc`;
	}
	
	const db = new Surreal();
	
	try {
		// Connect to the database
		await db.connect(connectionString);
		
		// Sign in as a namespace, database, or root user
		// For cloud instances, we need to use the scope parameter
		const isCloudInstance = connectionString.includes('surreal.cloud');
		if (isCloudInstance) {
			await db.signin({
				username: user,
				password,
				namespace,
				database,
			});
		} else {
			await db.signin({
				username: user,
				password,
			});
		}
		
		// Select a specific namespace / database
		await db.use({ namespace, database });
		
		return db;
	} catch (error) {
		// console.error('Error connecting to SurrealDB:', error); // Keep error log? Maybe not needed for user.
		throw error;
	}
}
