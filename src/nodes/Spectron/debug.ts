const DEBUG_ENV = process.env.SPECTRON_DEBUG;
export const DEBUG = DEBUG_ENV === "true" || DEBUG_ENV === "1";

export function debugLog(
    operation: string,
    message: string,
    itemIndex?: number,
    data?: unknown,
): void {
    if (!DEBUG) return;
    const indexPart = itemIndex !== undefined ? ` [item:${itemIndex}]` : "";
    if (data === undefined) {
        // eslint-disable-next-line no-console
        console.log(`DEBUG (${operation})${indexPart} - ${message}`);
    } else {
        // eslint-disable-next-line no-console
        console.log(`DEBUG (${operation})${indexPart} - ${message}`, data);
    }
}
