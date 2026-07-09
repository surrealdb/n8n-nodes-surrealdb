import type { INodeProperties } from "n8n-workflow";
import { stringField } from "../../fieldHelpers";

const RESOURCE = "scope";

export const scopeOperations: INodeProperties[] = [
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
                description: "List registered scope nodes",
                action: "List scopes",
            },
            {
                name: "Register",
                value: "register",
                description: "Register a scope path with optional display metadata",
                action: "Register a scope",
            },
            {
                name: "Delete",
                value: "delete",
                description: "Delete (tombstone) a scope node by path",
                action: "Delete a scope",
            },
            {
                name: "Forget",
                value: "forget",
                description: "Forget (erase) a scope subtree",
                action: "Forget a scope subtree",
            },
        ],
        default: "list",
    },
];

export const scopeFields: INodeProperties[] = [
    stringField(
        "path",
        "Path",
        { resource: RESOURCE, operations: ["register", "delete"] },
        { required: true },
    ),
    stringField(
        "path",
        "Path",
        { resource: RESOURCE, operations: ["forget"] },
        { description: "Scope subtree to forget. Leave empty to target the whole context." },
    ),
    stringField("displayName", "Display Name", {
        resource: RESOURCE,
        operations: ["register"],
    }),
    stringField("description", "Description", {
        resource: RESOURCE,
        operations: ["register"],
    }),
];
