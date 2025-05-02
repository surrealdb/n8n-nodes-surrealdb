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
	ISurrealApiCredentials,
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
 * Resolve credential parameters, applying node-level overrides.
 *
 * @param self The execute functions instance
 * @param credentials Decrypted SurrealDB API credentials
 * @param nodeParamNamespace Optional namespace override from node parameters
 * @param nodeParamDatabase Optional database override from node parameters
 * @returns Resolved credential parameters
 * @throws NodeOperationError if credentials are not provided
 */
export function validateAndResolveSurrealCredentials(
	self: IExecuteFunctions,
	credentials?: ICredentialDataDecryptedObject,
	nodeParamNamespace?: string,
	nodeParamDatabase?: string,
): ISurrealCredentials {
	if (credentials === undefined) {
		throw new NodeOperationError(self.getNode(), 'No credentials got returned!');
	}

	// Cast to the specific credential type
	const surrealCredentials = credentials as unknown as ISurrealApiCredentials;

	// Apply overrides if provided and not empty
	const finalNamespace = nodeParamNamespace && nodeParamNamespace.trim() !== ''
		? nodeParamNamespace.trim()
		: surrealCredentials.namespace;

	const finalDatabase = nodeParamDatabase && nodeParamDatabase.trim() !== ''
		? nodeParamDatabase.trim()
		: surrealCredentials.database;

	// Return the final parameters, including overrides
	return {
		connectionString: surrealCredentials.connectionString.trim(),
		authentication: surrealCredentials.authentication,
		username: surrealCredentials.username,
		password: surrealCredentials.password,
		namespace: finalNamespace,
		database: finalDatabase,
	};
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

/**
 * Connects to SurrealDB and authenticates using the provided credentials.
 *
 * @param credentials Resolved SurrealDB credentials
 * @returns A connected and authenticated SurrealDB client instance
 * @throws Error if connection or authentication fails
 */
export async function connectSurrealClient(
	credentials: ISurrealCredentials,
) {
	const { connectionString, authentication: authType, username, password, namespace, database } = credentials;

	const db = new Surreal();

	try {
		// Connect to the database
		await db.connect(connectionString);

		// Sign in based on authentication type
		if (authType === 'Root') {
			// For root authentication, we just need username and password
			// @ts-ignore - The SurrealDB SDK types may not match our usage
			await db.signin({ username, password });
		} else if (authType === 'Namespace') {
			if (!namespace) {
				throw new Error('Namespace is required for Namespace authentication');
			}
			// For namespace authentication, we need username, password, and namespace
			// @ts-ignore - The SurrealDB SDK types may not match our usage
			await db.signin({ username, password, namespace });
			// @ts-ignore - The SurrealDB SDK types may not match our usage
			await db.use(namespace);
		} else if (authType === 'Database') {
			if (!namespace || !database) {
				throw new Error('Namespace and Database are required for Database authentication');
			}
			// For database authentication, we need username, password, namespace, and database
			// @ts-ignore - The SurrealDB SDK types may not match our usage
			await db.signin({ username, password, namespace, database });
			// @ts-ignore - The SurrealDB SDK types may not match our usage
			await db.use(namespace, database);
		}

		return db;
	} catch (error) {
		console.error('Error connecting to SurrealDB:', error);
		throw error;
	}
}
