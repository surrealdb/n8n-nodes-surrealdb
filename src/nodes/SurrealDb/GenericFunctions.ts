import { DEBUG } from "./debug";

import { Surreal } from "surrealdb";
import { NodeOperationError } from "n8n-workflow";

/**
 * Native implementation of lodash's get function
 * @param obj The object to get the value from
 * @param path The path to the property (supports dot notation)
 * @param defaultValue The default value to return if the path doesn't exist
 * @returns The value at the path or the default value
 */
function get(
    obj: Record<string, unknown> | null | undefined,
    path: string,
    defaultValue: unknown = undefined,
): unknown {
    const keys = path.split(".");
    let result: unknown = obj;

    for (const key of keys) {
        if (
            result === null ||
            result === undefined ||
            typeof result !== "object"
        ) {
            return defaultValue;
        }
        result = (result as Record<string, unknown>)[key];
    }

    return result !== undefined ? result : defaultValue;
}

/**
 * Native implementation of lodash's set function
 * @param obj The object to set the value on
 * @param path The path to the property (supports dot notation)
 * @param value The value to set
 * @returns The modified object
 */
function set(
    obj: Record<string, unknown>,
    path: string,
    value: unknown,
): Record<string, unknown> {
    const keys = path.split(".");
    let current = obj;

    // Prevent prototype pollution by blocking dangerous keys
    const dangerousKeys = ["__proto__", "constructor", "prototype"];
    for (const key of keys) {
        if (dangerousKeys.includes(key)) {
            // Optionally, throw an error or just return the object unchanged
            return obj;
        }
    }

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (
            !(key in current) ||
            current[key] === null ||
            typeof current[key] !== "object"
        ) {
            current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return obj;
}
import type {
    ICredentialDataDecryptedObject,
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
} from "n8n-workflow";

import type {
    ISurrealCredentials,
    ISurrealApiCredentials,
} from "./types/surrealDb.types";

import {
    classifyError,
    retryWithBackoff,
    validateConnection,
    ErrorCategory,
    ErrorSeverity,
    DEFAULT_RETRY_CONFIG,
} from "./errorHandling";

/**
 * Validate JSON input
 * @param self The execute functions instance
 * @param input The JSON string to validate
 * @param itemIndex The index of the current item
 * @returns The parsed JSON object
 * @throws NodeOperationError if the input is not valid JSON
 */
export function validateJSON(
    self: IExecuteFunctions,
    input: string,
    itemIndex: number,
): unknown {
    try {
        return JSON.parse(input);
    } catch {
        throw new NodeOperationError(self.getNode(), "Invalid JSON provided", {
            itemIndex,
        });
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
    field: unknown,
    fieldName: string,
    itemIndex: number,
): void {
    if (field === undefined || field === "") {
        throw new NodeOperationError(
            self.getNode(),
            `${fieldName} is required`,
            {
                itemIndex,
            },
        );
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
    field: unknown,
    fieldName: string,
    itemIndex: number,
): number {
    const num = Number(field);
    if (isNaN(num) || num < 0) {
        throw new NodeOperationError(
            self.getNode(),
            `${fieldName} must be a positive number`,
            {
                itemIndex,
            },
        );
    }
    return num;
}

/**
 * Clean and validate a table name
 * Handles table names with colons and ensures consistent formatting
 * @param tableInput The raw table name input from node parameters
 * @returns The cleaned table name, with everything after a colon (if present) removed
 */
export function cleanTableName(tableInput: unknown): string {
    // Ensure table is a string
    const table = String(tableInput || "");

    // If table contains a colon, use only the part before the colon
    if (table.includes(":")) {
        return table.split(":")[0];
    }

    return table;
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
    field: unknown,
    fieldName: string,
    itemIndex: number,
): void {
    if (!Array.isArray(field)) {
        throw new NodeOperationError(
            self.getNode(),
            `${fieldName} must be an array`,
            { itemIndex },
        );
    }
}

/**
 * Validate and parse data input
 * Handles both string and object inputs, converting string inputs to objects via JSON parsing
 * @param self The execute functions instance
 * @param dataInput The data input from node parameters (can be string or object)
 * @param fieldName The name of the field for error messages
 * @param itemIndex The index of the current item
 * @returns The parsed data object
 * @throws NodeOperationError if the data is invalid
 */
export function validateAndParseData(
    self: IExecuteFunctions,
    dataInput: unknown,
    fieldName: string,
    itemIndex: number,
): unknown {
    // Check if data is provided
    if (dataInput === undefined || dataInput === "") {
        throw new NodeOperationError(
            self.getNode(),
            `${fieldName} is required`,
            {
                itemIndex,
            },
        );
    }

    // Process data based on type
    if (typeof dataInput === "string") {
        // If it's a string, parse and validate as JSON
        try {
            return JSON.parse(dataInput);
        } catch {
            throw new NodeOperationError(
                self.getNode(),
                `${fieldName} must be valid JSON`,
                { itemIndex },
            );
        }
    } else if (typeof dataInput === "object" && dataInput !== null) {
        // If it's already an object, use it directly
        return dataInput;
    } else {
        // If it's neither string nor object, throw an error
        throw new NodeOperationError(
            self.getNode(),
            `${fieldName} must be a JSON string or a JSON object, received type: ${typeof dataInput}`,
            { itemIndex },
        );
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
        throw new NodeOperationError(
            self.getNode(),
            "No credentials got returned!",
        );
    }

    // Cast to the specific credential type
    const surrealCredentials = credentials as unknown as ISurrealApiCredentials;

    // Apply overrides if provided and not empty
    const finalNamespace =
        nodeParamNamespace && nodeParamNamespace.trim() !== ""
            ? nodeParamNamespace.trim()
            : surrealCredentials.namespace;

    const finalDatabase =
        nodeParamDatabase && nodeParamDatabase.trim() !== ""
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
    updateKey = "",
    useDotNotation = false,
    dateFields: string[] = [],
) {
    let data = items;

    if (updateKey) {
        if (!fields.includes(updateKey)) {
            fields.push(updateKey);
        }
        data = items.filter(item => item.json[updateKey] !== undefined);
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
                updateItem[field] = fieldData as IDataObject[keyof IDataObject];
            }
        }

        return updateItem;
    });

    return preparedItems;
}

export function prepareFields(fields: string) {
    return fields
        .split(",")
        .map(field => field.trim())
        .filter(field => !!field);
}

/**
 * Prepares a SurrealDB query for execution.
 *
 * Note: Namespace and database context are now set at the connection level
 * after authentication, so no USE statements are needed in queries.
 *
 * @param query The original query to prepare
 * @param credentials The resolved SurrealDB credentials (for validation purposes)
 * @returns The query as-is, since context is handled at connection level
 */
export function prepareSurrealQuery(
    query: string,
    credentials: ISurrealCredentials,
): string {
    // Validate that required namespace/database are provided for the authentication type
    const { authentication, namespace, database } = credentials;

    if (authentication === "Root") {
        if (!namespace || !database) {
            throw new Error(
                "Namespace and Database are required for Root authentication",
            );
        }
    } else if (authentication === "Namespace") {
        if (!namespace || !database) {
            throw new Error(
                "Namespace and Database are required for Namespace authentication",
            );
        }
    } else if (authentication === "Database") {
        if (!namespace || !database) {
            throw new Error(
                "Namespace and Database are required for Database authentication",
            );
        }
    }

    // Return the query as-is since context is now handled at connection level
    return query;
}

/**
 * Build a SELECT query with pagination options.
 *
 * @param table The table name to select from
 * @param options Optional pagination options (limit, start)
 * @param where Optional WHERE clause
 * @param orderBy Optional ORDER BY clause
 * @param fields Optional fields to select (defaults to *)
 * @returns An object with the query string and parameters
 */
export function buildSelectQuery(
    table: string,
    options: { limit?: number; start?: number } = {},
    where?: string,
    orderBy?: string,
    fields = "*",
): { query: string; params: Record<string, unknown> } {
    // Initialize the query and parameters
    let query = `SELECT ${fields} FROM ${table}`;
    const params: Record<string, unknown> = {};

    // Add WHERE clause if provided
    if (where) {
        query += ` WHERE ${where}`;
    }

    // Add ORDER BY clause if provided
    if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
    }

    // Add LIMIT if provided
    if (options.limit !== undefined) {
        query += ` LIMIT ${options.limit}`;
        params.limit = options.limit;
    }

    // Add START if provided and greater than 0
    if (options.start !== undefined && options.start > 0) {
        query += ` START ${options.start}`;
        params.start = options.start;
    }

    return { query, params };
}

/**
 * Build an INFO query for a table or index.
 *
 * @param objectType Type of object to get info for ("TABLE" or "INDEX")
 * @param name Name of the table or index
 * @param table Table name (required for indexes)
 * @returns The info query string
 */
export function buildInfoQuery(
    objectType: "TABLE" | "INDEX",
    name: string,
    table?: string,
): string {
    if (objectType === "INDEX" && !table) {
        throw new Error("Table name is required for INDEX info queries");
    }

    return objectType === "TABLE"
        ? `INFO FOR TABLE ${name};`
        : `INFO FOR INDEX ${name} ON TABLE ${table};`;
}

/**
 * Build a DELETE query for records or entire tables.
 *
 * @param table The table name
 * @param where Optional WHERE clause to filter records (if not provided, deletes all records)
 * @returns The delete query string
 */
export function buildDeleteQuery(table: string, where?: string): string {
    let query = `DELETE FROM ${table}`;

    // Add WHERE clause if provided
    if (where) {
        query += ` WHERE ${where}`;
    }

    return query;
}

/**
 * Build an UPDATE query for records.
 *
 * @param table The table name
 * @param where Optional WHERE clause to filter records (if not provided, updates all records)
 * @param paramName The parameter name to use for the data content
 * @returns The update query string
 */
export function buildUpdateQuery(
    table: string,
    where?: string,
    paramName = "data",
): string {
    let query = `UPDATE ${table} CONTENT $${paramName}`;

    // Add WHERE clause if provided
    if (where) {
        query += ` WHERE ${where}`;
    }

    return query;
}

/**
 * Build a MERGE query for records.
 *
 * @param table The table name
 * @param where Optional WHERE clause to filter records (if not provided, merges all records)
 * @param paramName The parameter name to use for the data content
 * @returns The merge query string
 */
export function buildMergeQuery(
    table: string,
    where?: string,
    paramName = "data",
): string {
    let query = `UPDATE ${table} MERGE $${paramName}`;

    // Add WHERE clause if provided
    if (where) {
        query += ` WHERE ${where}`;
    }

    return query;
}

/**
 * Build a CREATE query for records.
 *
 * @param table The table name
 * @param paramName The parameter name to use for the data content
 * @returns The create query string
 */
export function buildCreateQuery(table: string, paramName = "data"): string {
    return `CREATE ${table} CONTENT $${paramName}`;
}

/**
 * Build the resolved credentials object from n8n credentials and node parameters.
 *
 * @param credentials The credentials from executeFunctions.getCredentials
 * @param options The node options object that may contain namespace/database overrides
 * @returns The resolved SurrealDB credentials object
 */
export function buildCredentialsObject(
    credentials: ICredentialDataDecryptedObject,
    options: IDataObject,
): ISurrealCredentials {
    const nodeNamespace = (options.namespace as string)?.trim() || "";
    const nodeDatabase = (options.database as string)?.trim() || "";

    return {
        connectionString: credentials.connectionString as string,
        authentication: credentials.authentication as
            | "Root"
            | "Namespace"
            | "Database",
        username: credentials.username as string,
        password: credentials.password as string,
        namespace: nodeNamespace || (credentials.namespace as string),
        database: nodeDatabase || (credentials.database as string),
    };
}

/**
 * Result of checking a SurrealDB query result for errors
 */
export interface IQueryResultCheck {
    success: boolean;
    errorMessage?: string;
    errorCategory?: ErrorCategory;
    errorSeverity?: ErrorSeverity;
    errorDetails?: Record<string, unknown>;
}

/**
 * Check if a SurrealDB query result contains an error.
 * SurrealDB typically returns errors in the results array with an 'error' property.
 *
 * @param result The query result from SurrealDB
 * @param errorPrefix A prefix for the error message
 * @returns An object with success status and enhanced error information
 */
export function checkQueryResult(
    result: unknown,
    errorPrefix: string,
): IQueryResultCheck {
    // Check if the result is an array and if the first element has an error property
    const hasError =
        Array.isArray(result) &&
        result.length > 0 &&
        result[0] &&
        typeof result[0] === "object" &&
        "error" in result[0];

    if (hasError) {
        // Extract the error message safely
        const errorObj = result[0] as Record<string, unknown>;
        const errorText = String(errorObj.error || "Unknown error");
        const errorMessage = `${errorPrefix}: ${errorText}`;

        // Create a synthetic error for classification
        const syntheticError = new Error(errorText);
        const enhancedError = classifyError(syntheticError);

        return {
            success: false,
            errorMessage,
            errorCategory: enhancedError.category,
            errorSeverity: enhancedError.severity,
            errorDetails: {
                originalError: errorText,
                resultStructure: Array.isArray(result)
                    ? `Array with ${result.length} elements`
                    : typeof result,
                timestamp: new Date().toISOString(),
            },
        };
    }

    // No error found
    return {
        success: true,
    };
}

export async function connectSurrealClient(credentials: ISurrealCredentials) {
    const {
        connectionString,
        username,
        password,
        namespace,
        database,
        authentication: authType,
    } = credentials;

    const db = new Surreal();

    // Enhanced connection with retry logic
    return await retryWithBackoff(
        async () => {
            try {
                // Validate that the connection string is not a WebSocket connection
                if (
                    connectionString.startsWith("ws://") ||
                    connectionString.startsWith("wss://")
                ) {
                    throw new Error(
                        "WebSocket connections (ws:// or wss://) are not supported. Please use HTTP/HTTPS connections only.",
                    );
                }

                // Validate required fields based on authentication type
                if (authType === "Namespace" && !namespace) {
                    throw new Error(
                        "Namespace is required for Namespace authentication",
                    );
                }
                if (authType === "Database" && (!namespace || !database)) {
                    throw new Error(
                        "Namespace and Database are required for Database authentication",
                    );
                }

                // Connect to SurrealDB
                await db.connect(connectionString);

                // Sign in based on authentication type
                if (authType === "Root") {
                    await db.signin({ username, password });
                } else if (authType === "Namespace") {
                    await db.signin({ username, password, namespace });
                } else if (authType === "Database") {
                    await db.signin({
                        username,
                        password,
                        namespace,
                        database,
                    });
                }

                // Apply namespace and database context after authentication
                if (namespace && database) {
                    if (DEBUG) {
                        // eslint-disable-next-line no-console
                        console.log(
                            "DEBUG - connectSurrealClient - Setting namespace and database context:",
                            namespace,
                            database,
                        );
                    }
                    await db.use({ namespace, database });
                } else if (namespace) {
                    if (DEBUG) {
                        // eslint-disable-next-line no-console
                        console.log(
                            "DEBUG - connectSurrealClient - Setting namespace context:",
                            namespace,
                        );
                    }
                    await db.use({ namespace });
                }

                // Validate the connection with a simple query
                const isValid = await validateConnection(db);
                if (!isValid) {
                    throw new Error("Connection validation failed after setup");
                }

                return db;
            } catch (error) {
                const enhancedError = classifyError(error as Error);

                if (DEBUG) {
                    // eslint-disable-next-line no-console
                    console.error("DEBUG - Error connecting to SurrealDB:", {
                        category: enhancedError.category,
                        severity: enhancedError.severity,
                        message: enhancedError.message,
                        retryable: enhancedError.retryable,
                    });
                }

                throw error;
            }
        },
        {
            ...DEFAULT_RETRY_CONFIG,
            retryableErrors: [
                ErrorCategory.CONNECTION_ERROR,
                ErrorCategory.TIMEOUT_ERROR,
                ErrorCategory.SYSTEM_ERROR,
            ],
        },
        {
            operation: "connectSurrealClient",
            connectionString: connectionString.substring(0, 50) + "...", // Log partial connection string for security
            authentication: authType,
            namespace,
            database,
        },
    );
}
