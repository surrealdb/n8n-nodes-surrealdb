/**
 * Centralized debug configuration for SurrealDB n8n node
 *
 * This module provides a shared debug flag that can be controlled via:
 * 1. Environment variable SURREAL_DEBUG (set to 'true' or '1' to enable)
 * 2. Direct import and usage in other modules
 */

// Read debug flag from environment variable
const DEBUG_ENV = process.env.SURREAL_DEBUG;
const DEBUG_FROM_ENV = DEBUG_ENV === "true" || DEBUG_ENV === "1";

// Export the debug flag - can be overridden by importing modules if needed
export const DEBUG = DEBUG_FROM_ENV;

/**
 * Enhanced debug logging function that respects the centralized DEBUG flag
 *
 * @param operation The name of the operation (e.g., "createRecord", "getAllRecords")
 * @param message The log message
 * @param itemIndex The index of the current item (optional)
 * @param data Additional data to log (optional)
 */
export function debugLog(
    operation: string,
    message: string,
    itemIndex?: number,
    data?: unknown,
): void {
    if (!DEBUG) return;

    // Determine if itemIndex should be included in the log
    const indexPart = itemIndex !== undefined ? ` [item:${itemIndex}]` : "";

    // Basic log without additional data
    if (data === undefined) {
        // eslint-disable-next-line no-console
        console.log(`DEBUG (${operation})${indexPart} - ${message}`);
    }
    // Log with additional data
    else {
        // eslint-disable-next-line no-console
        console.log(`DEBUG (${operation})${indexPart} - ${message}`, data);
    }
}

/**
 * Helper function to conditionally execute debug-only code
 *
 * @param callback Function to execute only when DEBUG is true
 */
export function debugOnly(callback: () => void): void {
    if (DEBUG) {
        callback();
    }
}
