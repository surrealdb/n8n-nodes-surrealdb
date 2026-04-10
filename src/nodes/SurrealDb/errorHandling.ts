import { NodeOperationError } from "n8n-workflow";
import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import type { ISurrealCredentials } from "./types/surrealDb.types";
import { DEBUG } from "./debug";

// Add global setTimeout for Node.js environment
declare const setTimeout: (_callback: () => void, _ms: number) => void;

/**
 * Error categories for better error handling and recovery
 */
export enum ErrorCategory {
    // Connection and authentication errors
    CONNECTION_ERROR = "CONNECTION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    // Protocol incompatibility between the SDK and the SurrealDB server
    VERSION_ERROR = "VERSION_ERROR",

    // Query and data errors
    QUERY_SYNTAX_ERROR = "QUERY_SYNTAX_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    DATA_TYPE_ERROR = "DATA_TYPE_ERROR",

    // Permission and access errors
    PERMISSION_ERROR = "PERMISSION_ERROR",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    // Table does not exist — a more specific subcase of RESOURCE_NOT_FOUND.
    // Split out because SurrealDB 3.x made this a hard error (in 2.x it
    // returned an empty array), and read operations can opt into translating
    // it back to an empty result to preserve workflow compatibility.
    TABLE_NOT_FOUND = "TABLE_NOT_FOUND",

    // System and infrastructure errors
    SYSTEM_ERROR = "SYSTEM_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",

    // Unknown errors
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL",
}

/**
 * Enhanced error information
 */
export interface IEnhancedError {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    originalError: Error;
    retryable: boolean;
    maxRetries: number;
    retryDelay: number;
    context?: Record<string, unknown>;
}

/**
 * Retry configuration
 */
export interface IRetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: ErrorCategory[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: IRetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrors: [
        ErrorCategory.CONNECTION_ERROR,
        ErrorCategory.TIMEOUT_ERROR,
        ErrorCategory.RATE_LIMIT_ERROR,
        ErrorCategory.SYSTEM_ERROR,
    ],
};

/**
 * Enhanced error result for continueOnFail scenarios
 */
export interface IEnhancedErrorResult {
    error: {
        message: string;
        category: ErrorCategory;
        severity: ErrorSeverity;
        retryable: boolean;
        context?: Record<string, unknown>;
        timestamp: string;
        retryCount?: number;
    };
}

/**
 * Classify an error based on its message and properties
 */
export function classifyError(error: Error): IEnhancedError {
    const message = error.message.toLowerCase();

    // SDK ↔ server protocol version mismatch. Must run before the connection
    // branch because these errors typically include the word "connection" in
    // the wrapper message (e.g. "Connection creation failed: The version ...
    // reported by the engine is not supported by this library"). Treat as
    // permanent — retrying cannot recover from a version incompatibility.
    if (
        message.includes("reported by the engine") ||
        message.includes("not supported by this library") ||
        message.includes("expected a version that satisfies") ||
        message.includes("requires version") ||
        (message.includes("version") && message.includes("not supported"))
    ) {
        return {
            category: ErrorCategory.VERSION_ERROR,
            severity: ErrorSeverity.HIGH,
            message: error.message,
            originalError: error,
            retryable: false,
            maxRetries: 0,
            retryDelay: 0,
        };
    }

    // Authentication errors. Must be checked BEFORE the catch-all
    // CONNECTION_ERROR branch below: the SurrealDB SDK's internal class is
    // ConnectionController, so any auth failure from client.signin() has
    // "connection" somewhere in its stack trace. If CONNECTION_ERROR ran
    // first with a stack-substring check, it would swallow auth errors and
    // mark them retryable — the retry loop would burn 4 attempts on a
    // permanent credentials problem.
    if (
        message.includes("authentication") ||
        message.includes("unauthorized") ||
        message.includes("forbidden") ||
        message.includes("invalid credentials") ||
        message.includes("access denied")
    ) {
        return {
            category: ErrorCategory.AUTHENTICATION_ERROR,
            severity: ErrorSeverity.CRITICAL,
            message: error.message,
            originalError: error,
            retryable: false,
            maxRetries: 0,
            retryDelay: 0,
        };
    }

    // Connection errors. Only match on message-level signals — the previous
    // stack.includes("connection") check was overly permissive and caused
    // false positives for errors that happened to flow through the SDK's
    // ConnectionController class (e.g., auth failures, version guards).
    if (
        message.includes("connection") ||
        message.includes("network") ||
        message.includes("econnrefused") ||
        message.includes("enotfound") ||
        message.includes("timeout")
    ) {
        return {
            category: ErrorCategory.CONNECTION_ERROR,
            severity: ErrorSeverity.HIGH,
            message: error.message,
            originalError: error,
            retryable: true,
            maxRetries: 3,
            retryDelay: 2000,
        };
    }

    // Timeout errors
    if (
        message.includes("timeout") ||
        message.includes("timed out") ||
        message.includes("deadline exceeded")
    ) {
        return {
            category: ErrorCategory.TIMEOUT_ERROR,
            severity: ErrorSeverity.MEDIUM,
            message: error.message,
            originalError: error,
            retryable: true,
            maxRetries: 2,
            retryDelay: 1000,
        };
    }

    // Query syntax errors
    if (
        message.includes("syntax") ||
        message.includes("parse") ||
        message.includes("invalid query") ||
        message.includes("malformed")
    ) {
        return {
            category: ErrorCategory.QUERY_SYNTAX_ERROR,
            severity: ErrorSeverity.MEDIUM,
            message: error.message,
            originalError: error,
            retryable: false,
            maxRetries: 0,
            retryDelay: 0,
        };
    }

    // Validation errors
    if (
        message.includes("validation") ||
        message.includes("invalid") ||
        message.includes("required") ||
        message.includes("missing")
    ) {
        return {
            category: ErrorCategory.VALIDATION_ERROR,
            severity: ErrorSeverity.LOW,
            message: error.message,
            originalError: error,
            retryable: false,
            maxRetries: 0,
            retryDelay: 0,
        };
    }

    // Permission errors
    if (
        message.includes("permission") ||
        message.includes("not allowed") ||
        message.includes("insufficient privileges")
    ) {
        return {
            category: ErrorCategory.PERMISSION_ERROR,
            severity: ErrorSeverity.HIGH,
            message: error.message,
            originalError: error,
            retryable: false,
            maxRetries: 0,
            retryDelay: 0,
        };
    }

    // Table not found errors. SurrealDB 3.x made "SELECT/DELETE/UPDATE on a
    // non-existent table" a hard error (in 2.x it returned an empty array).
    // This branch MUST run before the generic RESOURCE_NOT_FOUND branch
    // below because that one matches "does not exist" too and would
    // otherwise swallow the more specific TABLE_NOT_FOUND classification.
    // Patterns observed from SurrealDB v3 errors:
    //   - "The table 'X' does not exist"
    //   - "Table 'X' does not exist"
    //   - "table `X` not found"
    if (
        (message.includes("table") && message.includes("does not exist")) ||
        (message.includes("table") && message.includes("not found"))
    ) {
        return {
            category: ErrorCategory.TABLE_NOT_FOUND,
            severity: ErrorSeverity.LOW,
            message: error.message,
            originalError: error,
            retryable: false,
            maxRetries: 0,
            retryDelay: 0,
        };
    }

    // Resource not found errors
    if (
        message.includes("not found") ||
        message.includes("does not exist") ||
        message.includes("no such")
    ) {
        return {
            category: ErrorCategory.RESOURCE_NOT_FOUND,
            severity: ErrorSeverity.MEDIUM,
            message: error.message,
            originalError: error,
            retryable: false,
            maxRetries: 0,
            retryDelay: 0,
        };
    }

    // Rate limit errors
    if (
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        message.includes("throttled")
    ) {
        return {
            category: ErrorCategory.RATE_LIMIT_ERROR,
            severity: ErrorSeverity.MEDIUM,
            message: error.message,
            originalError: error,
            retryable: true,
            maxRetries: 5,
            retryDelay: 5000,
        };
    }

    // System errors
    if (
        message.includes("internal") ||
        message.includes("server error") ||
        message.includes("system") ||
        message.includes("database")
    ) {
        return {
            category: ErrorCategory.SYSTEM_ERROR,
            severity: ErrorSeverity.HIGH,
            message: error.message,
            originalError: error,
            retryable: true,
            maxRetries: 2,
            retryDelay: 3000,
        };
    }

    // Unknown errors
    return {
        category: ErrorCategory.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        originalError: error,
        retryable: false,
        maxRetries: 0,
        retryDelay: 0,
    };
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
    attempt: number,
    config: IRetryConfig,
): number {
    const delay =
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: IRetryConfig = DEFAULT_RETRY_CONFIG,
    context?: Record<string, unknown>,
): Promise<T> {
    let lastError: Error | undefined;
    // Track the actual number of attempts made. The for-loop's own `attempt`
    // variable is scoped to the loop block and is not accessible after break,
    // and the previous code reported `config.maxRetries + 1` even for errors
    // that broke out on the first try — producing misleading messages like
    // "Operation failed after 4 attempts" when only 1 attempt was actually
    // performed.
    let actualAttempts = 0;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
        actualAttempts = attempt;
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            const enhancedError = classifyError(lastError);

            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log(
                    `DEBUG - Retry attempt ${attempt}/${config.maxRetries + 1} failed:`,
                    enhancedError.category,
                    enhancedError.message,
                );
            }

            // Check if we should retry this error
            if (
                attempt <= config.maxRetries &&
                enhancedError.retryable &&
                config.retryableErrors.includes(enhancedError.category)
            ) {
                const delay = calculateBackoffDelay(attempt, config);

                if (DEBUG) {
                    // eslint-disable-next-line no-console
                    console.log(`DEBUG - Retrying in ${delay}ms...`);
                }

                await sleep(delay);
                continue;
            }

            // Don't retry or max retries reached
            break;
        }
    }

    // All retries failed, throw the last error with enhanced context
    if (!lastError) {
        throw new Error("Operation failed but no error was captured");
    }

    const enhancedError = classifyError(lastError);

    // Tailor the thrown message to what actually happened:
    // - If the error was non-retryable and the loop broke on the first try,
    //   surface the original error directly with no retry wrapper.
    // - Otherwise, report the actual number of attempts made (not the max).
    const retryError =
        actualAttempts === 1 && !enhancedError.retryable
            ? new Error(enhancedError.message)
            : new Error(
                  `Operation failed after ${actualAttempts} attempt${actualAttempts === 1 ? "" : "s"}. Last error: ${enhancedError.message}`,
              );

    // Preserve the original error stack
    retryError.stack = lastError.stack;

    // Add enhanced error information
    (retryError as unknown as Record<string, unknown>).enhancedError =
        enhancedError;
    (retryError as unknown as Record<string, unknown>).retryContext = {
        attempts: actualAttempts,
        config,
        context,
    };

    throw retryError;
}

/**
 * Enhanced error handler for operations
 */
export function handleOperationError(
    error: Error,
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
    operationName: string,
    context?: Record<string, unknown>,
): INodeExecutionData {
    const enhancedError = classifyError(error);

    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
            `DEBUG - ${operationName} error:`,
            enhancedError.category,
            enhancedError.severity,
            enhancedError.message,
        );
    }

    // Add context to the enhanced error
    enhancedError.context = {
        operation: operationName,
        itemIndex,
        timestamp: new Date().toISOString(),
        ...context,
    };

    // If continueOnFail is enabled, return an error result
    if (executeFunctions.continueOnFail()) {
        return {
            json: {
                error: {
                    message: enhancedError.message,
                    category: enhancedError.category,
                    severity: enhancedError.severity,
                    retryable: enhancedError.retryable,
                    context: enhancedError.context,
                    timestamp: enhancedError.context.timestamp,
                },
            },
            pairedItem: { item: itemIndex },
        };
    }

    // Otherwise, throw a NodeOperationError with enhanced information
    const errorMessage = `${operationName} failed: ${enhancedError.message}`;
    const nodeError = new NodeOperationError(
        executeFunctions.getNode(),
        errorMessage,
        {
            itemIndex,
            description: `Error Category: ${enhancedError.category}, Severity: ${enhancedError.severity}`,
        },
    );

    // Add enhanced error information to the node error
    (nodeError as unknown as Record<string, unknown>).enhancedError =
        enhancedError;

    throw nodeError;
}

/**
 * Initialize a SurrealDB client connection: connect to the server, authenticate
 * with the configured credentials, and set the namespace/database context.
 *
 * This is the shared lifecycle primitive used by every code path that brings
 * up (or resurrects) a Surreal client:
 *   - ConnectionPool.createConnection (pool factory path)
 *   - GenericFunctions.connectSurrealClient (ad-hoc connection path)
 *   - recoverConnection (in-place connection recovery — see below)
 *
 * The caller is responsible for:
 *   - Constructing (or reusing) the Surreal client instance.
 *   - Wrapping this call in a retry loop if retries are desired.
 *   - Catching errors and deciding whether to close the client / bump stats.
 *
 * This helper only performs the minimum preconditions plus the connect →
 * signin → use sequence. It does NOT run a post-setup health check — callers
 * that need one should call validateConnection() afterwards.
 */
export async function initializeSurrealClient(
    client: Surreal,
    credentials: ISurrealCredentials,
): Promise<void> {
    const {
        connectionString,
        username,
        password,
        namespace,
        database,
        authentication: authType,
    } = credentials;

    // Reject WebSocket protocol — n8n only supports HTTP/HTTPS.
    if (
        connectionString.startsWith("ws://") ||
        connectionString.startsWith("wss://")
    ) {
        throw new Error(
            "WebSocket connections (ws:// or wss://) are not supported. Please use HTTP/HTTPS connections only.",
        );
    }

    // Validate required fields based on authentication scope.
    if (authType === "Namespace" && !namespace) {
        throw new Error("Namespace is required for Namespace authentication");
    }
    if (authType === "Database" && (!namespace || !database)) {
        throw new Error(
            "Namespace and Database are required for Database authentication",
        );
    }

    // 1. Connect to the server. The SDK's own handshake does a built-in
    //    version compatibility check here and throws if the server is outside
    //    its supported range; that error is caught by classifyError below.
    await client.connect(connectionString);

    // 1a. Explicit server-version guard. Belt-and-braces on top of the SDK's
    //     own check: this node's v0.6.0 line only supports SurrealDB server
    //     v3.0.0 and newer. If you need to talk to an older server, pin
    //     @surrealdb/n8n-nodes-surrealdb@0.5.x. The thrown message contains
    //     phrases matched by classifyError's VERSION_ERROR branch so it
    //     fails fast with no retry loop.
    const { version: rawVersion } = await client.version();
    const versionMatch = rawVersion.match(/(\d+)\.(\d+)\.(\d+)/);
    if (versionMatch) {
        const majorVersion = parseInt(versionMatch[1], 10);
        if (majorVersion < 3) {
            throw new Error(
                `SurrealDB server version "${rawVersion}" is not supported by this library; requires version >= 3.0.0. For older servers use @surrealdb/n8n-nodes-surrealdb@0.5.x.`,
            );
        }
    }

    // 2. Authenticate. Order matters: signin before use so the session is
    //    fully authenticated when the namespace/database context is applied.
    if (authType === "Root") {
        await client.signin({ username, password });
    } else if (authType === "Namespace") {
        await client.signin({ username, password, namespace });
    } else if (authType === "Database") {
        await client.signin({ username, password, namespace, database });
    }

    // 3. Set the namespace/database context. Only set what's present — an
    //    authenticated Root session with no ns/db is a valid configuration.
    //    Historical note: an earlier version of ConnectionPool.createConnection
    //    defaulted database to "test" when namespace was set but database was
    //    not. That was a tutorial-copy artifact and has been removed — if you
    //    want the "test" database, configure it explicitly in credentials.
    if (namespace && database) {
        await client.use({ namespace, database });
    } else if (namespace) {
        await client.use({ namespace });
    }
}

/**
 * Connection recovery utility.
 *
 * Attempts to bring an existing broken Surreal client back to life by
 * re-running the full connect → signin → use sequence in place, with a
 * bounded retry loop. Used by errorWrapper's recovery strategies when a
 * transient connection failure might be resolved by reconnecting without
 * taking the whole pool entry out of service.
 *
 * Returns true on success, false after exhausting all attempts.
 */
export async function recoverConnection(
    client: Surreal,
    credentials: {
        connectionString: string;
        authentication: string;
        username: string;
        password: string;
        namespace?: string;
        database?: string;
    },
    maxAttempts = 3,
): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log(
                    `DEBUG - Connection recovery attempt ${attempt}/${maxAttempts}`,
                );
            }

            // The inline credentials type here uses `authentication: string`
            // for historical callers in errorWrapper.ts; the runtime value is
            // always one of "Root" | "Namespace" | "Database", so the cast to
            // the narrower ISurrealCredentials shape is safe.
            await initializeSurrealClient(
                client,
                credentials as ISurrealCredentials,
            );

            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log("DEBUG - Connection recovery successful");
            }

            return true;
        } catch (error) {
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log(
                    `DEBUG - Connection recovery attempt ${attempt} failed:`,
                    error.message,
                );
            }

            if (attempt === maxAttempts) {
                return false;
            }

            // Wait before retrying
            await sleep(1000 * attempt);
        }
    }

    return false;
}

/**
 * Validate connection health
 */
export async function validateConnection(client: Surreal): Promise<boolean> {
    try {
        // Try a simple query to test the connection
        await client.query("RETURN 1");
        return true;
    } catch (error) {
        if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log("DEBUG - Connection validation failed:", error.message);
        }
        return false;
    }
}

/**
 * Enhanced query execution with connection recovery
 */
export async function executeQueryWithRecovery<T extends unknown[]>(
    client: Surreal,
    query: string,
    credentials: {
        connectionString: string;
        authentication: string;
        username: string;
        password: string;
        namespace?: string;
        database?: string;
    },
    parameters?: Record<string, unknown>,
): Promise<T> {
    // v2 SDK note: `client.query<T>(sql, params)` returns a `Query<T>` that
    // extends DispatchedPromise and resolves to `Collect<T, false>` — a
    // mapped-type wrapper over T. Calling `.json()` flips J to true so the
    // awaited result is `Jsonify<T>` instead: RecordId/Datetime/Decimal/etc.
    // wrappers are converted to their JSON-compatible string/number forms.
    // n8n needs JSON-compatible output for display and inter-node data flow,
    // so this is the correct default for every call site. The cast to T is
    // still required because TS can't prove structural equivalence.
    try {
        // First attempt
        return (await client.query<T>(query, parameters).json()) as T;
    } catch (error) {
        const enhancedError = classifyError(error as Error);

        // Only attempt recovery for connection-related errors
        if (
            enhancedError.category === ErrorCategory.CONNECTION_ERROR ||
            enhancedError.category === ErrorCategory.TIMEOUT_ERROR
        ) {
            if (DEBUG) {
                // eslint-disable-next-line no-console
                console.log("DEBUG - Attempting connection recovery...");
            }

            const recovered = await recoverConnection(client, credentials);
            if (recovered) {
                // Retry the query after successful recovery
                return (await client.query<T>(query, parameters).json()) as T;
            }
        }

        // Re-throw the original error if recovery failed or not applicable
        throw error;
    }
}

/**
 * Create a standardized error result with enhanced information
 */
export function createEnhancedErrorResult(
    error: Error,
    itemIndex: number,
    operationName?: string,
    context?: Record<string, unknown>,
): INodeExecutionData {
    const enhancedError = classifyError(error);

    return {
        json: {
            error: {
                message: enhancedError.message,
                category: enhancedError.category,
                severity: enhancedError.severity,
                retryable: enhancedError.retryable,
                context: {
                    operation: operationName,
                    itemIndex,
                    timestamp: new Date().toISOString(),
                    ...context,
                },
            },
        },
        pairedItem: { item: itemIndex },
    };
}

/**
 * Log error with enhanced information
 */
export function logEnhancedError(
    error: Error,
    operationName: string,
    itemIndex: number,
    context?: Record<string, unknown>,
): void {
    const enhancedError = classifyError(error);

    const logData = {
        operation: operationName,
        itemIndex,
        category: enhancedError.category,
        severity: enhancedError.severity,
        message: enhancedError.message,
        retryable: enhancedError.retryable,
        timestamp: new Date().toISOString(),
        context,
    };

    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
            "DEBUG - Enhanced Error Log:",
            JSON.stringify(logData, null, 2),
        );
    }
}
