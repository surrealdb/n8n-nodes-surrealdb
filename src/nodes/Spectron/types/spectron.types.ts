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

/**
 * Context handed to every Spectron operation. `returnData` is the accumulator
 * for the current resource run; operations push their result(s) onto it (most
 * via `pushResult`, the binary document download via `prepareBinaryData`).
 */
export interface ISpectronOperationContext {
    client: Spectron;
    credentials: ISpectronCredentials;
    executeFunctions: IExecuteFunctions;
    itemIndex: number;
    returnData: INodeExecutionData[];
}

/** A single Spectron operation, executed once per input item. */
export type SpectronOperation = (
    ctx: ISpectronOperationContext,
) => Promise<void>;
