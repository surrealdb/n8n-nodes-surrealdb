import type {
    IExecuteFunctions,
    INodeExecutionData,
    IDataObject,
} from "n8n-workflow";
import type { Surreal } from "surrealdb";
import { DEBUG } from "./debug";

// Add global setTimeout for Node.js environment
declare const setTimeout: (_callback: () => void, _ms: number) => void;
import {
    classifyError,
    retryWithBackoff,
    handleOperationError,
    recoverConnection,
    validateConnection,
    executeQueryWithRecovery,
    ErrorCategory,
    ErrorSeverity,
} from "./errorHandling";
import {
    getErrorConfig,
    getRecoveryStrategy,
    RecoveryStrategy,
} from "./errorConfig";

/**
 * Operation context for error handling
 */
export interface IOperationContext {
    operationName: string;
    itemIndex: number;
    credentials?: {
        connectionString: string;
        authentication: string;
        username: string;
        password: string;
        namespace?: string;
        database?: string;
    };
    additionalContext?: Record<string, unknown>;
}

/**
 * Enhanced operation result
 */
export interface IEnhancedOperationResult {
    success: boolean;
    data?: unknown;
    error?: {
        message: string;
        category: ErrorCategory;
        severity: ErrorSeverity;
        retryable: boolean;
        context?: Record<string, unknown>;
    };
    retryCount?: number;
    recoveryAttempts?: number;
}

/**
 * Wrapper for SurrealDB operations with comprehensive error handling
 */
export async function executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: IOperationContext,
    executeFunctions: IExecuteFunctions,
    client?: Surreal,
): Promise<INodeExecutionData> {
    const { operationName, itemIndex, credentials, additionalContext } =
        context;

    // Get error configuration for this operation type
    const errorConfig = getErrorConfig(operationName);

    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(`DEBUG - ${operationName} - Starting with error config:`, {
            maxRetries: errorConfig.maxRetries,
            retryableErrors: errorConfig.retryableErrors,
            enableConnectionRecovery: errorConfig.enableConnectionRecovery,
        });
    }

    try {
        // Execute operation with retry logic
        const result = await retryWithBackoff(
            async () => {
                return await operation();
            },
            {
                maxRetries: errorConfig.maxRetries,
                baseDelay: errorConfig.baseDelay,
                maxDelay: errorConfig.maxDelay,
                backoffMultiplier: errorConfig.backoffMultiplier,
                retryableErrors: errorConfig.retryableErrors,
            },
            {
                operation: operationName,
                itemIndex,
                ...additionalContext,
            },
        );

        // Success - return the result
        return {
            json: result as IDataObject,
            pairedItem: { item: itemIndex },
        };
    } catch (error) {
        const enhancedError = classifyError(error as Error);
        const recoveryStrategy = getRecoveryStrategy(
            enhancedError.category,
            operationName,
        );

        if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log(`DEBUG - ${operationName} - Error occurred:`, {
                category: enhancedError.category,
                severity: enhancedError.severity,
                recoveryStrategy,
                retryable: enhancedError.retryable,
            });
        }

        // Try recovery based on strategy
        if (errorConfig.enableConnectionRecovery && client && credentials) {
            const recovered = await attemptRecovery(
                operation,
                enhancedError,
                recoveryStrategy,
                client,
                credentials,
                context,
            );

            if (recovered.success) {
                return {
                    json: recovered.data as IDataObject,
                    pairedItem: { item: itemIndex },
                };
            }
        }

        // Recovery failed or not applicable - handle the error
        return handleOperationError(
            error as Error,
            executeFunctions,
            itemIndex,
            operationName,
            {
                ...additionalContext,
                recoveryStrategy,
                recoveryAttempts: 1,
            },
        );
    }
}

/**
 * Attempt recovery based on the recovery strategy
 */
async function attemptRecovery<T>(
    operation: () => Promise<T>,
    enhancedError: {
        message: string;
        category: ErrorCategory;
        severity: ErrorSeverity;
        retryable: boolean;
    },
    recoveryStrategy: RecoveryStrategy,
    client: Surreal,
    credentials: {
        connectionString: string;
        authentication: string;
        username: string;
        password: string;
        namespace?: string;
        database?: string;
    },
    context: IOperationContext,
): Promise<IEnhancedOperationResult> {
    const { operationName } = context;

    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
            `DEBUG - ${operationName} - Attempting recovery with strategy:`,
            recoveryStrategy,
        );
    }

    try {
        switch (recoveryStrategy) {
            case RecoveryStrategy.CONNECTION_RECOVERY:
                return await attemptConnectionRecovery(
                    operation,
                    client,
                    credentials,
                    context,
                );

            case RecoveryStrategy.VALIDATION_RETRY:
                return await attemptValidationRetry(operation, client, context);

            case RecoveryStrategy.FULL_RECOVERY:
                return await attemptFullRecovery(
                    operation,
                    client,
                    credentials,
                    context,
                );

            case RecoveryStrategy.RETRY_ONLY:
            default:
                // No additional recovery attempts
                return {
                    success: false,
                    error: {
                        message: enhancedError.message,
                        category: enhancedError.category,
                        severity: enhancedError.severity,
                        retryable: enhancedError.retryable,
                    },
                };
        }
    } catch (recoveryError) {
        if (DEBUG) {
            // eslint-disable-next-line no-console
            console.log(
                `DEBUG - ${operationName} - Recovery failed:`,
                recoveryError.message,
            );
        }

        return {
            success: false,
            error: {
                message: `Recovery failed: ${recoveryError.message}`,
                category: ErrorCategory.SYSTEM_ERROR,
                severity: ErrorSeverity.HIGH,
                retryable: false,
            },
            recoveryAttempts: 1,
        };
    }
}

/**
 * Attempt connection recovery
 */
async function attemptConnectionRecovery<T>(
    operation: () => Promise<T>,
    client: Surreal,
    credentials: {
        connectionString: string;
        authentication: string;
        username: string;
        password: string;
        namespace?: string;
        database?: string;
    },
    context: IOperationContext,
): Promise<IEnhancedOperationResult> {
    const { operationName } = context;

    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(
            `DEBUG - ${operationName} - Attempting connection recovery`,
        );
    }

    // Try to recover the connection
    const recovered = await recoverConnection(client, credentials, 2);

    if (!recovered) {
        return {
            success: false,
            error: {
                message: "Connection recovery failed",
                category: ErrorCategory.CONNECTION_ERROR,
                severity: ErrorSeverity.HIGH,
                retryable: false,
            },
            recoveryAttempts: 1,
        };
    }

    // Validate the connection
    const isValid = await validateConnection(client);
    if (!isValid) {
        return {
            success: false,
            error: {
                message: "Connection validation failed after recovery",
                category: ErrorCategory.CONNECTION_ERROR,
                severity: ErrorSeverity.HIGH,
                retryable: false,
            },
            recoveryAttempts: 1,
        };
    }

    // Try the operation again
    try {
        const result = await operation();
        return {
            success: true,
            data: result,
            recoveryAttempts: 1,
        };
    } catch (error) {
        const enhancedError = classifyError(error as Error);
        return {
            success: false,
            error: {
                message: `Operation failed after connection recovery: ${enhancedError.message}`,
                category: enhancedError.category,
                severity: enhancedError.severity,
                retryable: enhancedError.retryable,
            },
            recoveryAttempts: 1,
        };
    }
}

/**
 * Attempt validation retry
 */
async function attemptValidationRetry<T>(
    operation: () => Promise<T>,
    client: Surreal,
    context: IOperationContext,
): Promise<IEnhancedOperationResult> {
    const { operationName } = context;

    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(`DEBUG - ${operationName} - Attempting validation retry`);
    }

    // For validation errors, we might want to try with different parameters
    // For now, just retry once with a delay
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));

    try {
        const result = await operation();
        return {
            success: true,
            data: result,
            recoveryAttempts: 1,
        };
    } catch (error) {
        const enhancedError = classifyError(error as Error);
        return {
            success: false,
            error: {
                message: `Validation retry failed: ${enhancedError.message}`,
                category: enhancedError.category,
                severity: enhancedError.severity,
                retryable: enhancedError.retryable,
            },
            recoveryAttempts: 1,
        };
    }
}

/**
 * Attempt full recovery (connection + validation)
 */
async function attemptFullRecovery<T>(
    operation: () => Promise<T>,
    client: Surreal,
    credentials: {
        connectionString: string;
        authentication: string;
        username: string;
        password: string;
        namespace?: string;
        database?: string;
    },
    context: IOperationContext,
): Promise<IEnhancedOperationResult> {
    const { operationName } = context;

    if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(`DEBUG - ${operationName} - Attempting full recovery`);
    }

    // First try connection recovery
    const connectionResult = await attemptConnectionRecovery(
        operation,
        client,
        credentials,
        context,
    );
    if (connectionResult.success) {
        return connectionResult;
    }

    // If connection recovery failed, try validation retry
    const validationResult = await attemptValidationRetry(
        operation,
        client,
        context,
    );
    if (validationResult.success) {
        return validationResult;
    }

    // Both recovery attempts failed
    return {
        success: false,
        error: {
            message:
                "Full recovery failed - both connection and validation recovery attempts failed",
            category: ErrorCategory.SYSTEM_ERROR,
            severity: ErrorSeverity.CRITICAL,
            retryable: false,
        },
        recoveryAttempts: 2,
    };
}

/**
 * Enhanced query execution wrapper
 */
export async function executeQueryWithEnhancedErrorHandling<
    T extends unknown[],
>(
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
    context: IOperationContext,
    executeFunctions: IExecuteFunctions,
    parameters?: Record<string, unknown>,
): Promise<INodeExecutionData> {
    return executeWithErrorHandling(
        async () => {
            return await executeQueryWithRecovery<T>(
                client,
                query,
                credentials,
                parameters,
            );
        },
        context,
        executeFunctions,
        client,
    );
}

/**
 * Enhanced record operation wrapper
 */
export async function executeRecordOperationWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: IOperationContext,
    executeFunctions: IExecuteFunctions,
    client?: Surreal,
): Promise<INodeExecutionData> {
    return executeWithErrorHandling(
        operation,
        context,
        executeFunctions,
        client,
    );
}

/**
 * Enhanced table operation wrapper
 */
export async function executeTableOperationWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: IOperationContext,
    executeFunctions: IExecuteFunctions,
    client?: Surreal,
): Promise<INodeExecutionData> {
    return executeWithErrorHandling(
        operation,
        context,
        executeFunctions,
        client,
    );
}

/**
 * Enhanced system operation wrapper
 */
export async function executeSystemOperationWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: IOperationContext,
    executeFunctions: IExecuteFunctions,
    client?: Surreal,
): Promise<INodeExecutionData> {
    return executeWithErrorHandling(
        operation,
        context,
        executeFunctions,
        client,
    );
}
