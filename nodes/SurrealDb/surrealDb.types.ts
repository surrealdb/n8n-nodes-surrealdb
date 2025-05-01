/**
 * Credentials object for SurrealDB, if using individual parameters
 */
export interface ISurrealParametricCredentials {
	/**
	 * Whether to allow overriding the parametric credentials with a connection string
	 */
	configurationType: 'values';

	protocol: string;
	host: string;
	port: number;
	namespace: string;
	database: string;
	user: string;
	password: string;
}

/**
 * Credentials object for SurrealDB, if using override connection string
 */
export interface ISurrealOverrideCredentials {
	/**
	 * Whether to allow overriding the parametric credentials with a connection string
	 */
	configurationType: 'connectionString';
	/**
	 * If using an override connection string, this is where it will be.
	 */
	connectionString: string;
	namespace: string;
	database: string;
	user: string;
	password: string;
}

/**
 * Unified credential object type (whether params are overridden with a connection string or not)
 */
export type ISurrealCredentialsType = ISurrealParametricCredentials | ISurrealOverrideCredentials;

/**
 * Resolve the database and connection string from input credentials
 */
export type ISurrealCredentials = {
	/**
	 * Namespace name
	 */
	namespace: string;
	/**
	 * Database name
	 */
	database: string;
	/**
	 * Generated connection string (after validating and figuring out overrides)
	 */
	connectionString: string;
	/**
	 * Username for authentication
	 */
	user: string;
	/**
	 * Password for authentication
	 */
	password: string;
};
