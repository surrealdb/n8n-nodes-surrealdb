import type { IPairedItemData } from 'n8n-workflow';

/**
 * Generate paired item data for the given number of items
 */
export function generatePairedItemData(length: number): IPairedItemData[] {
	return Array.from({ length }, (_, index) => ({
		item: index,
	}));
}
