import { NodeOperationError } from "n8n-workflow";
import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
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

    // Query and data errors
    QUERY_SYNTAX_ERROR = "QUERY_SYNTAX_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    DATA_TYPE_ERROR = "DATA_TYPE_ERROR",

    // Permission and access errors
    PERMISSION_ERROR = "PERMISSION_ERROR",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",

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
    const stack = error.stack?.toLowerCase() || "";

    // Connection errors
    if (
        message.includes("connection") ||
        message.includes("network") ||
        message.includes("econnrefused") ||
        message.includes("enotfound") ||
        message.includes("timeout") ||
        stack.includes("connection")
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

    // Authentication errors
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

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
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
    const retryError = new Error(
        `Operation failed after ${config.maxRetries + 1} attempts. Last error: ${enhancedError.message}`,
    );

    // Preserve the original error stack
    retryError.stack = lastError.stack;

    // Add enhanced error information
    (retryError as unknown as Record<string, unknown>).enhancedError =
        enhancedError;
    (retryError as unknown as Record<string, unknown>).retryContext = {
        attempts: config.maxRetries + 1,
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
 * Connection recovery utility
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

            // Try to reconnect
            await client.connect(credentials.connectionString);

            // Re-authenticate
            if (credentials.authentication === "Root") {
                await client.signin({
                    username: credentials.username,
                    password: credentials.password,
                });
            } else if (credentials.authentication === "Namespace") {
                await client.signin({
                    username: credentials.username,
                    password: credentials.password,
                    namespace: credentials.namespace,
                });
            } else if (credentials.authentication === "Database") {
                await client.signin({
                    username: credentials.username,
                    password: credentials.password,
                    namespace: credentials.namespace,
                    database: credentials.database,
                });
            }

            // Set context
            if (credentials.namespace && credentials.database) {
                await client.use({
                    namespace: credentials.namespace,
                    database: credentials.database,
                });
            } else if (credentials.namespace) {
                await client.use({ namespace: credentials.namespace });
            }

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
    try {
        // First attempt
        return await client.query<T>(query, parameters);
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
                return await client.query<T>(query, parameters);
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
