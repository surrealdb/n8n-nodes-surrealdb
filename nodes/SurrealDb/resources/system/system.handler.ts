import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { Surreal } from 'surrealdb';
import { healthCheckOperation } from './operations/healthCheck.operation';
import { versionOperation } from './operations/version.operation';
import { createErrorResult } from '../../utilities';

/**
 * Handle all operations for the System resource
 */
export async function handleSystemOperations(
	operation: string,
	client: Surreal,
	items: INodeExecutionData[],
	executeFunctions: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
	let returnData: INodeExecutionData[] = [];
	const itemsLength = items.length;

	for (let i = 0; i < itemsLength; i++) {
		try {
			switch (operation) {
				case 'healthCheck':
					returnData = [...returnData, ...(await healthCheckOperation.execute(client, items, executeFunctions, i))];
					break;
				case 'version':
					returnData = [...returnData, ...(await versionOperation.execute(client, items, executeFunctions, i))];
					break;
				default:
					throw new Error(`The operation "${operation}" is not supported for the System resource!`);
			}
		} catch (error) {
			if (executeFunctions.continueOnFail()) {
				returnData.push(createErrorResult(error as Error, i));
				continue;
			}
			throw error;
		}
	}

	return returnData;
}