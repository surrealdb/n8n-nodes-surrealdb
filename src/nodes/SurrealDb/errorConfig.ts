import { ErrorCategory } from "./errorHandling";

/**
 * Error handling configuration for different operation types
 */
export interface IErrorConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: ErrorCategory[];
    enableConnectionRecovery: boolean;
    enableQueryValidation: boolean;
    logErrorDetails: boolean;
}

/**
 * Default error configuration
 */
export const DEFAULT_ERROR_CONFIG: IErrorConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
        ErrorCategory.CONNECTION_ERROR,
        ErrorCategory.TIMEOUT_ERROR,
        ErrorCategory.RATE_LIMIT_ERROR,
        ErrorCategory.SYSTEM_ERROR,
    ],
    enableConnectionRecovery: true,
    enableQueryValidation: true,
    logErrorDetails: true,
};

/**
 * Error configuration for read operations (queries, selects)
 */
export const READ_OPERATION_CONFIG: IErrorConfig = {
    ...DEFAULT_ERROR_CONFIG,
    maxRetries: 2, // Fewer retries for read operations
    baseDelay: 500, // Faster retry for read operations
    retryableErrors: [
        ErrorCategory.CONNECTION_ERROR,
        ErrorCategory.TIMEOUT_ERROR,
        ErrorCategory.SYSTEM_ERROR,
    ],
};

/**
 * Error configuration for write operations (create, update, delete)
 */
export const WRITE_OPERATION_CONFIG: IErrorConfig = {
    ...DEFAULT_ERROR_CONFIG,
    maxRetries: 3, // More retries for write operations
    baseDelay: 1000,
    retryableErrors: [
        ErrorCategory.CONNECTION_ERROR,
        ErrorCategory.TIMEOUT_ERROR,
        ErrorCategory.RATE_LIMIT_ERROR,
        ErrorCategory.SYSTEM_ERROR,
    ],
};

/**
 * Error configuration for critical operations (schema changes, authentication)
 */
export const CRITICAL_OPERATION_CONFIG: IErrorConfig = {
    ...DEFAULT_ERROR_CONFIG,
    maxRetries: 1, // Minimal retries for critical operations
    baseDelay: 2000, // Longer delay for critical operations
    retryableErrors: [
        ErrorCategory.CONNECTION_ERROR,
        ErrorCategory.TIMEOUT_ERROR,
    ],
    enableConnectionRecovery: true,
};

/**
 * Error configuration for bulk operations
 */
export const BULK_OPERATION_CONFIG: IErrorConfig = {
    ...DEFAULT_ERROR_CONFIG,
    maxRetries: 2,
    baseDelay: 1500,
    retryableErrors: [
        ErrorCategory.CONNECTION_ERROR,
        ErrorCategory.TIMEOUT_ERROR,
        ErrorCategory.RATE_LIMIT_ERROR,
    ],
};

/**
 * Get error configuration based on operation type
 */
export function getErrorConfig(operationType: string): IErrorConfig {
    const operationTypeLower = operationType.toLowerCase();

    if (
        operationTypeLower.includes("read") ||
        operationTypeLower.includes("select") ||
        operationTypeLower.includes("get") ||
        operationTypeLower.includes("query")
    ) {
        return READ_OPERATION_CONFIG;
    }

    if (
        operationTypeLower.includes("write") ||
        operationTypeLower.includes("create") ||
        operationTypeLower.includes("update") ||
        operationTypeLower.includes("delete") ||
        operationTypeLower.includes("insert") ||
        operationTypeLower.includes("upsert") ||
        operationTypeLower.includes("merge")
    ) {
        return WRITE_OPERATION_CONFIG;
    }

    if (
        operationTypeLower.includes("schema") ||
        operationTypeLower.includes("auth") ||
        operationTypeLower.includes("connect") ||
        operationTypeLower.includes("critical")
    ) {
        return CRITICAL_OPERATION_CONFIG;
    }

    if (
        operationTypeLower.includes("bulk") ||
        operationTypeLower.includes("batch") ||
        operationTypeLower.includes("many")
    ) {
        return BULK_OPERATION_CONFIG;
    }

    return DEFAULT_ERROR_CONFIG;
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
    RETRY_ONLY = "RETRY_ONLY",
    CONNECTION_RECOVERY = "CONNECTION_RECOVERY",
    VALIDATION_RETRY = "VALIDATION_RETRY",
    FULL_RECOVERY = "FULL_RECOVERY",
}

/**
 * Get recovery strategy based on error category and operation type
 */
export function getRecoveryStrategy(
    errorCategory: ErrorCategory,
    _operationType: string,
): RecoveryStrategy {
    // For connection errors, always try connection recovery
    if (errorCategory === ErrorCategory.CONNECTION_ERROR) {
        return RecoveryStrategy.CONNECTION_RECOVERY;
    }

    // For authentication errors, no recovery possible
    if (errorCategory === ErrorCategory.AUTHENTICATION_ERROR) {
        return RecoveryStrategy.RETRY_ONLY;
    }

    // For validation errors, try validation retry
    if (errorCategory === ErrorCategory.VALIDATION_ERROR) {
        return RecoveryStrategy.VALIDATION_RETRY;
    }

    // For system errors, try full recovery
    if (errorCategory === ErrorCategory.SYSTEM_ERROR) {
        return RecoveryStrategy.FULL_RECOVERY;
    }

    // For other errors, use retry only
    return RecoveryStrategy.RETRY_ONLY;
}

/**
 * Error severity thresholds for different operation types
 */
export const ERROR_SEVERITY_THRESHOLDS = {
    READ_OPERATIONS: {
        LOW: true, // Continue on low severity errors
        MEDIUM: true, // Continue on medium severity errors
        HIGH: false, // Stop on high severity errors
        CRITICAL: false, // Always stop on critical errors
    },
    WRITE_OPERATIONS: {
        LOW: true,
        MEDIUM: false, // Stop on medium severity errors for writes
        HIGH: false,
        CRITICAL: false,
    },
    CRITICAL_OPERATIONS: {
        LOW: false, // Stop on any error for critical operations
        MEDIUM: false,
        HIGH: false,
        CRITICAL: false,
    },
};

/**
 * Get error severity threshold for operation type
 */
export function getErrorSeverityThreshold(operationType: string) {
    const operationTypeLower = operationType.toLowerCase();

    if (
        operationTypeLower.includes("read") ||
        operationTypeLower.includes("select") ||
        operationTypeLower.includes("get") ||
        operationTypeLower.includes("query")
    ) {
        return ERROR_SEVERITY_THRESHOLDS.READ_OPERATIONS;
    }

    if (
        operationTypeLower.includes("write") ||
        operationTypeLower.includes("create") ||
        operationTypeLower.includes("update") ||
        operationTypeLower.includes("delete") ||
        operationTypeLower.includes("insert") ||
        operationTypeLower.includes("upsert") ||
        operationTypeLower.includes("merge")
    ) {
        return ERROR_SEVERITY_THRESHOLDS.WRITE_OPERATIONS;
    }

    if (
        operationTypeLower.includes("schema") ||
        operationTypeLower.includes("auth") ||
        operationTypeLower.includes("connect") ||
        operationTypeLower.includes("critical")
    ) {
        return ERROR_SEVERITY_THRESHOLDS.CRITICAL_OPERATIONS;
    }

    return ERROR_SEVERITY_THRESHOLDS.READ_OPERATIONS;
}
