import type { ICredentialDataDecryptedObject } from "n8n-workflow";
import type { ISurrealCredentials } from "../../types/surrealDb.types";

/**
 * Helper function to create a resolved credentials object
 */
export function createResolvedCredentials(
    credentials: ICredentialDataDecryptedObject,
    nodeNamespace: string,
    nodeDatabase: string,
): ISurrealCredentials {
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
