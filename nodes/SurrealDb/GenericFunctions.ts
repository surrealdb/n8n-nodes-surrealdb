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
	// Add /rpc to the connection string if it's not already there
	if (!connectionString.endsWith('/rpc')) {
		connectionString = connectionString.endsWith('/') ? `${connectionString}rpc` : `${connectionString}/rpc`;
	}
	
	console.log('Connecting to SurrealDB with:', {
		connectionString,
		namespace,
		database,
		user,
		password, // Show actual password for debugging
	});
	
	const db = new Surreal();
	
	try {
		// Connect to the database
		console.log('Connecting to:', connectionString);
		await db.connect(connectionString);
		
		// Sign in as a namespace, database, or root user
		console.log('Signing in with:', { username: user, password }); // Show actual password for debugging
		await db.signin({
			username: user,
			password,
		});
		
		// Select a specific namespace / database
		console.log('Using namespace/database:', { namespace, database });
		await db.use({ namespace, database });
		
		console.log('Successfully connected to SurrealDB');
		return db;
	} catch (error) {
		console.error('Error connecting to SurrealDB:', error);
		throw error;
	}
}
