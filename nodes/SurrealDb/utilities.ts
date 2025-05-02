import type { IPairedItemData, INodeExecutionData } from 'n8n-workflow';
import { RecordId } from 'surrealdb';

/**
 * Generate paired item data for the given number of items
 */
export function generatePairedItemData(length: number): IPairedItemData[] {
	return Array.from({ length }, (_, index) => ({
		item: index,
	}));
}

/**
 * Create a RecordId object from table name and ID
 * This is required for SurrealDB operations that work with specific records
 * @param table The table name
 * @param id The record ID
 * @returns A RecordId object that can be used with SurrealDB SDK methods
 */
export function createRecordId(table: string, id: string): RecordId {
	return new RecordId(table, id);
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
