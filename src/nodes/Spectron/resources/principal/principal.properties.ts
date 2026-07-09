import type { INodeProperties } from "n8n-workflow";
import { stringField } from "../../fieldHelpers";

const RESOURCE = "principal";

const VERB_OPTIONS = [
    { name: "Read", value: "read" },
    { name: "Write", value: "write" },
    { name: "Create Scope", value: "create_scope" },
    { name: "Delete Scope", value: "delete_scope" },
    { name: "Grant", value: "grant" },
    { name: "Manage", value: "manage" },
    { name: "Forget", value: "forget" },
];

export const principalOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: [RESOURCE] } },
        options: [
            {
                name: "List",
                value: "list",
                description: "List all principals in the context",
                action: "List principals",
            },
            {
                name: "Get",
                value: "get",
                description: "Fetch a principal and its declared grants",
                action: "Get a principal",
            },
            {
                name: "Effective",
                value: "effective",
                description: "Resolve the verbs a principal effectively holds at a path",
                action: "Get effective grants",
            },
            {
                name: "Grant",
                value: "grant",
                description: "Grant a principal verbs over a scope pattern",
                action: "Grant verbs",
            },
            {
                name: "Revoke",
                value: "revoke",
                description: "Revoke verbs from a principal over a scope pattern",
                action: "Revoke verbs",
            },
        ],
        default: "list",
    },
];

export const principalFields: INodeProperties[] = [
    stringField(
        "principalId",
        "Principal ID",
        {
            resource: RESOURCE,
            operations: ["get", "effective", "grant", "revoke"],
        },
        { required: true },
    ),
    stringField(
        "path",
        "Scope Path",
        { resource: RESOURCE, operations: ["effective", "grant", "revoke"] },
        { required: true },
    ),
    stringField(
        "asOf",
        "As Of",
        { resource: RESOURCE, operations: ["effective"] },
        { description: "Optional point-in-time (ISO timestamp)" },
    ),
    {
        displayName: "Verbs",
        name: "verbs",
        type: "multiOptions",
        options: VERB_OPTIONS,
        default: [],
        required: true,
        description: "Grant verbs to apply",
        displayOptions: {
            show: { resource: [RESOURCE], operation: ["grant", "revoke"] },
        },
    },
];
