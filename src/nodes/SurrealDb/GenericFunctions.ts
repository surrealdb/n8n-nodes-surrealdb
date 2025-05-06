// Set to true to enable debug logging, false to disable
const DEBUG = false;

import get from "lodash/get";
import set from "lodash/set";
import { Surreal } from "surrealdb";
import { NodeOperationError } from "n8n-workflow";
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
  itemIndex: number
): any {
  try {
    return JSON.parse(input);
  } catch (error) {
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
  field: any,
  fieldName: string,
  itemIndex: number
): void {
  if (field === undefined || field === "") {
    throw new NodeOperationError(self.getNode(), `${fieldName} is required`, {
      itemIndex,
    });
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
  itemIndex: number
): number {
  const num = Number(field);
  if (isNaN(num) || num < 0) {
    throw new NodeOperationError(
      self.getNode(),
      `${fieldName} must be a positive number`,
      {
        itemIndex,
      }
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
export function cleanTableName(tableInput: any): string {
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
  field: any,
  fieldName: string,
  itemIndex: number
): void {
  if (!Array.isArray(field)) {
    throw new NodeOperationError(
      self.getNode(),
      `${fieldName} must be an array`,
      { itemIndex }
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
  dataInput: any,
  fieldName: string,
  itemIndex: number
): any {
  // Check if data is provided
  if (dataInput === undefined || dataInput === null || dataInput === "") {
    throw new NodeOperationError(self.getNode(), `${fieldName} is required`, {
      itemIndex,
    });
  }

  // Process data based on type
  if (typeof dataInput === "string") {
    // If it's a string, parse and validate as JSON
    return validateJSON(self, dataInput, itemIndex);
  } else if (typeof dataInput === "object" && dataInput !== null) {
    // If it's already an object, use it directly
    return dataInput;
  } else {
    // If it's neither string nor object, throw an error
    throw new NodeOperationError(
      self.getNode(),
      `${fieldName} must be a JSON string or a JSON object, received type: ${typeof dataInput}`,
      { itemIndex }
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
  nodeParamDatabase?: string
): ISurrealCredentials {
  if (credentials === undefined) {
    throw new NodeOperationError(
      self.getNode(),
      "No credentials got returned!"
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
  dateFields: string[] = []
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
    .split(",")
    .map((field) => field.trim())
    .filter((field) => !!field);
}

/**
 * Prepares a SurrealDB query based on the authentication type.
 *
 * - For Root authentication: Adds both namespace and database to queries
 * - For Namespace authentication: Adds database to queries
 * - For Database authentication: No modification needed
 *
 * @param query The original query to modify
 * @param credentials The resolved SurrealDB credentials
 * @returns The modified query with appropriate namespace/database context
 */
export function prepareSurrealQuery(
  query: string,
  credentials: ISurrealCredentials
): string {
  const { authentication, namespace, database } = credentials;

  // Early return if query is empty or authentication is Database (no modification needed)
  if (!query || authentication === "Database") {
    return query;
  }

  // For Root authentication, we need to add both namespace and database
  if (authentication === "Root") {
    if (!namespace || !database) {
      throw new Error(
        "Namespace and Database are required for queries with Root authentication"
      );
    }
    return `USE NS ${namespace} DB ${database}; ${query}`;
  }

  // For Namespace authentication, we need to add database
  if (authentication === "Namespace") {
    if (!database) {
      throw new Error(
        "Database is required for queries with Namespace authentication"
      );
    }
    return `USE DB ${database}; ${query}`;
  }

  // Default return (should not reach here based on the conditions above)
  return query;
}

/**
 * Connects to SurrealDB and authenticates using the provided credentials.
 *
 * @param credentials Resolved SurrealDB credentials
 * @returns A connected and authenticated SurrealDB client instance
 * @throws Error if connection or authentication fails
 */
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
  fields: string = "*"
): { query: string; params: Record<string, any> } {
  // Initialize the query and parameters
  let query = `SELECT ${fields} FROM ${table}`;
  const params: Record<string, any> = {};

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
    query += ` LIMIT $limit`;
    params.limit = options.limit;
  }

  // Add START if provided and greater than 0
  if (options.start !== undefined && options.start > 0) {
    query += ` START $start`;
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
  table?: string
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
  paramName: string = "data"
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
  paramName: string = "data"
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
export function buildCreateQuery(
  table: string,
  paramName: string = "data"
): string {
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
  credentials: any,
  options: IDataObject
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
 * Check if a SurrealDB query result contains an error.
 * SurrealDB typically returns errors in the results array with an 'error' property.
 *
 * @param result The query result from SurrealDB
 * @param executeFunctions n8n execution functions
 * @param errorPrefix A prefix for the error message
 * @param itemIndex The index of the current item
 * @returns True if no error was found, false if processing should stop due to error
 * @throws NodeOperationError if an error is found and continueOnFail is false
 */
/**
 * Result of checking a SurrealDB query result for errors
 */
export interface IQueryResultCheck {
  success: boolean;
  errorMessage?: string;
}

/**
 * Check if a SurrealDB query result contains an error.
 * SurrealDB typically returns errors in the results array with an 'error' property.
 *
 * @param result The query result from SurrealDB
 * @param errorPrefix A prefix for the error message
 * @param itemIndex The index of the current item
 * @returns An object with success status and optional error message
 */
export function checkQueryResult(
  result: any,
  errorPrefix: string,
  itemIndex: number
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

    return {
      success: false,
      errorMessage,
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
    authentication: authType,
    username,
    password,
    namespace,
    database,
  } = credentials;

  const db = new Surreal();

  try {
    // Format the connection string to ensure it's compatible with SurrealDB SDK
    // Remove trailing slashes and ensure it has the correct format
    let formattedConnectionString = connectionString.trim();

    // Remove trailing slash if present
    if (formattedConnectionString.endsWith("/")) {
      formattedConnectionString = formattedConnectionString.slice(0, -1);
    }

    // Ensure it ends with /rpc for HTTP/HTTPS connections
    if (
      (formattedConnectionString.startsWith("http://") ||
        formattedConnectionString.startsWith("https://")) &&
      !formattedConnectionString.endsWith("/rpc")
    ) {
      formattedConnectionString += "/rpc";
    }

    // For Database authentication, pass namespace and database directly in connect options
    if (authType === "Database") {
      if (!namespace || !database) {
        throw new Error(
          "Namespace and Database are required for Database authentication"
        );
      }

      if (DEBUG) {
        console.log(
          "DEBUG - connectSurrealClient - Connecting with options - Namespace:",
          namespace,
          "Database:",
          database
        );
      }

      // Connect with namespace and database in options
      await db.connect(formattedConnectionString, {
        namespace: namespace,
        database: database,
      });
    } else {
      // For other authentication types, just connect without options
      await db.connect(formattedConnectionString);
    }

    // Sign in based on authentication type
    if (authType === "Root") {
      // For root authentication, we just need username and password
      // @ts-ignore - The SurrealDB SDK types may not match our usage
      await db.signin({ username, password });

      // For Root authentication, we don't set namespace/database at connection time
      // Instead, we'll add USE statements to each query
    } else if (authType === "Namespace") {
      if (!namespace) {
        throw new Error("Namespace is required for Namespace authentication");
      }
      // For namespace authentication, we need username, password, and namespace
      // @ts-ignore - The SurrealDB SDK types may not match our usage
      await db.signin({ username, password, namespace });

      // For Namespace authentication, we set the namespace at connection time
      // but add USE DB statements to each query
      // @ts-ignore
      await db.use(namespace);
    } else if (authType === "Database") {
      if (!namespace || !database) {
        throw new Error(
          "Namespace and Database are required for Database authentication"
        );
      }
      // For database authentication, we need username, password, namespace, and database
      if (DEBUG) {
        console.log(
          "DEBUG - connectSurrealClient - Before signin - Authentication:",
          authType
        );
        console.log(
          "DEBUG - connectSurrealClient - Before signin - Username:",
          username
        );
        console.log(
          "DEBUG - connectSurrealClient - Before signin - Namespace:",
          namespace
        );
        console.log(
          "DEBUG - connectSurrealClient - Before signin - Database:",
          database
        );
      }
      // @ts-ignore - The SurrealDB SDK types may not match our usage
      await db.signin({ username, password, namespace, database });
      if (DEBUG) {
        console.log(
          "DEBUG - connectSurrealClient - After signin - Successfully signed in"
        );
      }

      // Note: We're not calling db.use() here because we've already set namespace and database in connect options
      if (DEBUG) {
        console.log(
          "DEBUG - connectSurrealClient - Using namespace and database from connect options"
        );
      }
    }

    return db;
  } catch (error) {
    if (DEBUG) {
      console.error("DEBUG - Error connecting to SurrealDB:", error);
    }
    throw error;
  }
}
