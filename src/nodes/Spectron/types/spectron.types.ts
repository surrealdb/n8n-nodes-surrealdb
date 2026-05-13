import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";

export interface ISpectronApiCredentials {
    endpoint: string;
    apiKey: string;
    context: string;
    timeout?: number;
    maxRetries?: number;
}

export type ISpectronCredentials = ISpectronApiCredentials;

export interface ISpectronOperationHandler {
    execute(
        client: Spectron,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]>;
}
