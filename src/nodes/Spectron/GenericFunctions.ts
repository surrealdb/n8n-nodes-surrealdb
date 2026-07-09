import type {
    ICredentialDataDecryptedObject,
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import { Session, Spectron, Transport } from "@surrealdb/spectron";
import type { Scope } from "@surrealdb/spectron";
import type {
    ISpectronApiCredentials,
    ISpectronCredentials,
    ISpectronOperationContext,
    SpectronOperation,
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
    return new Spectron({
        endpoint: credentials.endpoint,
        apiKey: credentials.apiKey,
        context: credentials.context,
        timeout: credentials.timeout,
        maxRetries: credentials.maxRetries,
    });
}

/**
 * Builds a low-level {@link Transport} from the resolved credentials. Used to
 * rehydrate a {@link Session} for an existing session id (the SDK only mints a
 * `Session` from `sessions.create`, and keeps its transport private).
 */
export function createTransport(credentials: ISpectronCredentials): Transport {
    return new Transport({
        endpoint: credentials.endpoint,
        apiKey: credentials.apiKey,
        timeoutMs: credentials.timeout,
        maxRetries: credentials.maxRetries,
    });
}

/**
 * Rehydrates a {@link Session} handle for an existing session id. `turns()`,
 * `context()`, and `close()` only read the session id and transport, so the
 * placeholder `createdAt`/`scopes` are never observed.
 */
export function getSession(
    credentials: ISpectronCredentials,
    sessionId: string,
): Session {
    return new Session(createTransport(credentials), credentials.context, {
        id: sessionId,
        createdAt: "",
        scopes: [],
    });
}

/**
 * Parses a user-supplied scope value into the shape the SDK accepts. A bare
 * string is a single path; a JSON array (`["a","b"]` or `[["a","b"]]`) is
 * forwarded as-is; anything else falls back to the raw string, which the SDK
 * normalises. Empty input yields `undefined` (the key's default write region).
 */
export function parseScope(raw?: string): Scope | undefined {
    if (raw === undefined) return undefined;
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "{}" || trimmed === "[]") return undefined;
    if (trimmed.startsWith("[")) {
        try {
            return JSON.parse(trimmed) as Scope;
        } catch {
            // Fall through to treating it as a literal path string.
        }
    }
    return trimmed;
}

/**
 * Parses an optional free-form JSON object field, returning `{}` when empty.
 * Throws a descriptive error when the JSON is invalid.
 */
export function parseJsonObject(
    raw: string | undefined,
    fieldLabel: string,
): Record<string, unknown> {
    if (!raw || raw.trim() === "") return {};
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
        throw new Error("value is not a JSON object");
    } catch (e) {
        throw new Error(
            `Invalid JSON in "${fieldLabel}": ${(e as Error).message}`,
        );
    }
}

/**
 * Parses a comma/newline-separated list into a trimmed string array, dropping
 * empty entries. Returns `undefined` when nothing remains.
 */
export function parseStringList(raw?: string): string[] | undefined {
    if (!raw || raw.trim() === "") return undefined;
    const list = raw
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s !== "");
    return list.length > 0 ? list : undefined;
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
    // A top-level array (e.g. `entities.list`, `keys.list`) becomes one output
    // item per element, matching n8n's convention for list operations.
    if (Array.isArray(data)) {
        if (data.length === 0) {
            returnData.push({
                json: {} as IDataObject,
                pairedItem: { item: itemIndex },
            });
            return;
        }
        for (const element of data) {
            returnData.push({
                json:
                    element && typeof element === "object"
                        ? (element as IDataObject)
                        : ({ result: element } as IDataObject),
                pairedItem: { item: itemIndex },
            });
        }
        return;
    }

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

/** Reads a required, trimmed string parameter, throwing when it is empty. */
export function requireString(
    self: IExecuteFunctions,
    name: string,
    itemIndex: number,
    label: string,
): string {
    const value = (self.getNodeParameter(name, itemIndex, "") as string) ?? "";
    const trimmed = value.trim();
    if (trimmed === "") {
        throw new Error(`${label} is required`);
    }
    return trimmed;
}

/**
 * Runs every input item through a single resource operation, honouring
 * `continueOnFail()`. Each operation pushes its own result(s) onto
 * `returnData` (JSON via `pushResult`, or binary via `prepareBinaryData`).
 */
export async function runOperations(
    operations: Record<string, SpectronOperation>,
    resourceLabel: string,
    ctx: {
        client: Spectron;
        credentials: ISpectronCredentials;
        items: INodeExecutionData[];
        executeFunctions: IExecuteFunctions;
    },
): Promise<INodeExecutionData[]> {
    const { client, credentials, items, executeFunctions } = ctx;
    const operation = executeFunctions.getNodeParameter(
        "operation",
        0,
    ) as string;

    const op = operations[operation];
    if (!op) {
        throw new NodeOperationError(
            executeFunctions.getNode(),
            `The operation "${operation}" is not supported for the ${resourceLabel} resource!`,
        );
    }

    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
        const opCtx: ISpectronOperationContext = {
            client,
            credentials,
            executeFunctions,
            itemIndex: i,
            returnData,
        };
        try {
            await op(opCtx);
        } catch (error) {
            if (executeFunctions.continueOnFail()) {
                pushError(returnData, error as Error, i);
                continue;
            }
            throw error;
        }
    }

    return returnData;
}
