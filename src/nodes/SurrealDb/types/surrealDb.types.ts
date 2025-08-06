import type { IDataObject } from "n8n-workflow";

/**
 * Interface for SurrealDB API credentials
 */
export interface ISurrealApiCredentials {
    connectionString: string;
    authentication: "Root" | "Namespace" | "Database";
    username: string;
    password: string;
    namespace?: string;
    database?: string;
}

/**
 * Interface for resolved SurrealDB credentials
 */
export interface ISurrealCredentials {
    connectionString: string;
    authentication: "Root" | "Namespace" | "Database";
    username: string;
    password: string;
    namespace?: string;
    database?: string;
}

/**
 * Interface for SurrealDB query parameters
 */
export interface ISurrealQueryParameters {
    [key: string]: IDataObject | string | number | boolean | null | undefined;
}
