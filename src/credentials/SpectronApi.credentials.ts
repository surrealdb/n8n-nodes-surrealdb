import {
    ICredentialType,
    INodeProperties,
    ICredentialTestRequest,
} from "n8n-workflow";

export class SpectronApi implements ICredentialType {
    name = "spectronApi";
    displayName = "Spectron API";
    documentationUrl =
        "https://github.com/surrealdb/surrealdb.js/tree/main/packages/spectron";
    properties: INodeProperties[] = [
        {
            displayName: "Endpoint",
            name: "endpoint",
            type: "string",
            required: true,
            default: "https://api.spectron.dev",
            placeholder: "e.g. https://api.spectron.dev",
            description:
                "Spectron API origin without a trailing slash (e.g. https://api.spectron.dev)",
        },
        {
            displayName: "API Key",
            name: "apiKey",
            type: "string",
            typeOptions: { password: true },
            required: true,
            default: "",
            description:
                "Bearer API key used to authenticate Spectron requests",
        },
        {
            displayName: "Context",
            name: "context",
            type: "string",
            required: true,
            default: "",
            placeholder: "e.g. acme-prod",
            description:
                "Spectron context id (the API path segment scoping this workspace/environment)",
        },
        {
            displayName: "Timeout (ms)",
            name: "timeout",
            type: "number",
            required: false,
            default: 30000,
            description: "Request timeout in milliseconds",
        },
        {
            displayName: "Max Retries",
            name: "maxRetries",
            type: "number",
            required: false,
            default: 3,
            description: "Maximum retry attempts for idempotent GET requests",
        },
    ];

    test: ICredentialTestRequest = {
        request: {
            baseURL: "={{$credentials.endpoint.trim()}}",
            url: "/health",
            method: "GET",
        },
    };
}
