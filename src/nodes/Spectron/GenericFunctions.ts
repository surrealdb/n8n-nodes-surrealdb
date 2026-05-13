import type {
    ICredentialDataDecryptedObject,
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import { Spectron } from "@surrealdb/spectron";
import type {
    ISpectronApiCredentials,
    ISpectronCredentials,
} from "./types/spectron.types";

export function validateAndResolveSpectronCredentials(
    self: IExecuteFunctions,
    credentials?: ICredentialDataDecryptedObject,
): ISpectronCredentials {
    if (credentials === undefined) {
        throw new NodeOperationError(
            self.getNode(),
            "No credentials got returned!",
        );
    }

    const c = credentials as unknown as ISpectronApiCredentials;

    if (!c.endpoint || c.endpoint.trim() === "") {
        throw new NodeOperationError(
            self.getNode(),
            "Spectron credential is missing an endpoint",
        );
    }
    if (!c.apiKey) {
        throw new NodeOperationError(
            self.getNode(),
            "Spectron credential is missing an apiKey",
        );
    }
    if (!c.context || c.context.trim() === "") {
        throw new NodeOperationError(
            self.getNode(),
            "Spectron credential is missing a context",
        );
    }

    return {
        endpoint: c.endpoint.trim(),
        apiKey: c.apiKey,
        context: c.context.trim(),
        timeout: c.timeout !== undefined ? Number(c.timeout) : undefined,
        maxRetries:
            c.maxRetries !== undefined ? Number(c.maxRetries) : undefined,
    };
}

export function createSpectronClient(
    credentials: ISpectronCredentials,
): Spectron {
    // `endpoint` is the upcoming option name; `baseUrl` is the currently
    // published name. Passing both lets a single literal work against both
    // versions — the unused key is ignored by the SDK.
    return new Spectron({
        endpoint: credentials.endpoint,
        baseUrl: credentials.endpoint,
        apiKey: credentials.apiKey,
        context: credentials.context,
        timeout: credentials.timeout,
        maxRetries: credentials.maxRetries,
    });
}

export function getItemParam<T = unknown>(
    self: IExecuteFunctions,
    name: string,
    itemIndex: number,
    fallback?: T,
): T {
    return self.getNodeParameter(name, itemIndex, fallback as IDataObject) as T;
}

export function pushResult(
    returnData: INodeExecutionData[],
    data: unknown,
    itemIndex: number,
): void {
    returnData.push({
        json:
            data && typeof data === "object"
                ? (data as IDataObject)
                : ({ result: data } as IDataObject),
        pairedItem: { item: itemIndex },
    });
}

export function pushError(
    returnData: INodeExecutionData[],
    error: Error,
    itemIndex: number,
): void {
    returnData.push({
        json: {
            error: error.message,
            stack: error.stack,
        },
        pairedItem: { item: itemIndex },
    });
}
