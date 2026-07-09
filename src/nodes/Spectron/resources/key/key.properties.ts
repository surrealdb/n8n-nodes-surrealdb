import type { INodeProperties } from "n8n-workflow";
import { numberField, stringField } from "../../fieldHelpers";

const RESOURCE = "key";

export const keyOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: [RESOURCE] } },
        options: [
            {
                name: "Create",
                value: "create",
                description: "Mint a new self-service API key (secret returned once)",
                action: "Create a key",
            },
            {
                name: "List",
                value: "list",
                description: "List key metadata (secrets are never included)",
                action: "List keys",
            },
            {
                name: "Rotate",
                value: "rotate",
                description: "Rotate a key, returning a fresh secret",
                action: "Rotate a key",
            },
            {
                name: "Delete",
                value: "delete",
                description: "Revoke a key by name",
                action: "Delete a key",
            },
        ],
        default: "create",
    },
];

export const keyFields: INodeProperties[] = [
    stringField("name", "Name", { resource: RESOURCE, operations: ["create"] }),
    numberField(
        "ttlSeconds",
        "TTL (seconds)",
        { resource: RESOURCE, operations: ["create", "rotate"] },
        undefined,
    ),
    {
        displayName: "Grants (JSON)",
        name: "grants",
        type: "json",
        default: "{}",
        description: "Optional grants object to attach to the key",
        displayOptions: {
            show: { resource: [RESOURCE], operation: ["create"] },
        },
    },
    stringField(
        "keyName",
        "Key Name",
        { resource: RESOURCE, operations: ["rotate", "delete"] },
        { required: true },
    ),
];
