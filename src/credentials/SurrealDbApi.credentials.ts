import {
    ICredentialType,
    INodeProperties,
    ICredentialTestRequest,
} from "n8n-workflow";

export class SurrealDbApi implements ICredentialType {
    name = "surrealDbApi";
    displayName = "SurrealDB API";
    documentationUrl = "https://surrealdb.com/docs";
    properties: INodeProperties[] = [
        {
            displayName: "Connection String",
            name: "connectionString",
            type: "string",
            required: true,
            default: "",
            placeholder:
                "e.g. https://localhost:8000 or https://<cloud-id>.surreal.cloud",
            description:
                "The connection string to your SurrealDB instance (must start with http:// or https://)",
        },
        {
            displayName: "Authentication",
            name: "authentication",
            type: "options",
            options: [
                {
                    name: "Root",
                    value: "Root",
                },
                {
                    name: "Namespace",
                    value: "Namespace",
                },
                {
                    name: "Database",
                    value: "Database",
                },
            ],
            required: true,
            default: "Root",
            description: "Authentication scope",
        },
        {
            displayName: "Username",
            name: "username",
            type: "string",
            required: true,
            default: "",
            description: "Username for authentication",
        },
        {
            displayName: "Password",
            name: "password",
            type: "string",
            typeOptions: { password: true },
            required: true,
            default: "",
            description: "Password for authentication",
        },
        {
            displayName: "Namespace",
            name: "namespace",
            type: "string",
            required: false,
            default: "",
            displayOptions: {
                show: {
                    authentication: ["Namespace", "Database"],
                },
            },
            description: "Target namespace",
        },
        {
            displayName: "Database",
            name: "database",
            type: "string",
            required: false,
            default: "",
            displayOptions: {
                show: {
                    authentication: ["Database"],
                },
            },
            description: "Target database",
        },
    ];

    // Define a test request to verify credentials when they are saved
    test: ICredentialTestRequest = {
        request: {
            baseURL: "={{$credentials.connectionString.trim()}}",
            url: "/version",
            method: "GET",
        },
    };
}
