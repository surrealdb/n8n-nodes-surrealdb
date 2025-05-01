import type { IPairedItemData, INodeExecutionData } from 'n8n-workflow';

/**
 * Generate paired item data for the given number of items
 */
export function generatePairedItemData(length: number): IPairedItemData[] {
	return Array.from({ length }, (_, index) => ({
		item: index,
	}));
}

/**
 * Create a record ID string from table name and ID
 * This is required for SurrealDB operations that work with specific records
 * Format: "table:id"
 */
export function createRecordId(table: string, id: string): string {
	return `${table}:${id}`;
}

/**
 * Format single result output
 * Standardizes the output format for operations that return a single result
 */
export function formatSingleResult(result: any): INodeExecutionData {
	return { json: { result } };
}

/**
 * Format array result output
 * Standardizes the output format for operations that return an array of results
 * Each item in the array becomes a separate n8n item
 */
export function formatArrayResult(results: any[]): INodeExecutionData[] {
	return results.map(item => ({ json: item }));
}
