import type { INodeProperties } from "n8n-workflow";
import { stringField } from "../../fieldHelpers";

const RESOURCE = "entity";

export const entityOperations: INodeProperties[] = [
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
                description: "List entities, optionally filtered by type",
                action: "List entities",
            },
            {
                name: "Get",
                value: "get",
                description: "Fetch one entity with its attributes and relations",
                action: "Get an entity",
            },
            {
                name: "History",
                value: "history",
                description: "Supersession history for one attribute key",
                action: "Get attribute history",
            },
            {
                name: "Delete",
                value: "delete",
                description: "Soft-delete an entity",
                action: "Delete an entity",
            },
        ],
        default: "list",
    },
];

export const entityFields: INodeProperties[] = [
    stringField("type", "Type Filter", { resource: RESOURCE, operations: ["list"] }),
    stringField(
        "entityType",
        "Entity Type",
        { resource: RESOURCE, operations: ["get", "history", "delete"] },
        { required: true },
    ),
    stringField(
        "name",
        "Name",
        { resource: RESOURCE, operations: ["get", "history", "delete"] },
        { required: true },
    ),
    stringField(
        "key",
        "Attribute Key",
        { resource: RESOURCE, operations: ["history"] },
        { required: true },
    ),
];
