import type { INodeProperties } from "n8n-workflow";
import { numberField, stringField } from "../../fieldHelpers";

const RESOURCE = "trace";

export const traceOperations: INodeProperties[] = [
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
                description: "List recent retrieval trace records",
                action: "List traces",
            },
            {
                name: "Get",
                value: "get",
                description: "Fetch one trace by id",
                action: "Get a trace",
            },
            {
                name: "Stats",
                value: "stats",
                description: "Aggregate trace statistics over the recent window",
                action: "Get trace stats",
            },
        ],
        default: "list",
    },
];

export const traceFields: INodeProperties[] = [
    numberField("limit", "Limit", { resource: RESOURCE, operations: ["list"] }, undefined),
    stringField(
        "traceId",
        "Trace ID",
        { resource: RESOURCE, operations: ["get"] },
        { required: true },
    ),
];
