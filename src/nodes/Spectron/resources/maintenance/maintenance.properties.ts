import type { INodeProperties } from "n8n-workflow";
import {
    additionalFieldsJson,
    booleanField,
    numberField,
    stringField,
} from "../../fieldHelpers";

const RESOURCE = "maintenance";

export const maintenanceOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: [RESOURCE] } },
        options: [
            {
                name: "Health",
                value: "health",
                description: "Liveness probe for the API",
                action: "Check health",
            },
            {
                name: "State",
                value: "state",
                description: "Structured memory state snapshot",
                action: "Get state",
            },
            {
                name: "Profile",
                value: "profile",
                description: "Static and dynamic profile slices",
                action: "Get profile",
            },
            {
                name: "Whoami",
                value: "whoami",
                description: "The calling principal's identity and resolved grants",
                action: "Get identity",
            },
            {
                name: "Inspect",
                value: "inspect",
                description: "Inspect an entity, attribute, or trace by reference",
                action: "Inspect a reference",
            },
            {
                name: "Audit",
                value: "audit",
                description: "List audit rows for write/recall activity",
                action: "List audit rows",
            },
            {
                name: "Consolidate",
                value: "consolidate",
                description: "Consolidate accumulated observations into durable facts",
                action: "Consolidate observations",
            },
            {
                name: "Elaborate",
                value: "elaborate",
                description: "Infer and emit new relation edges between entities",
                action: "Elaborate relations",
            },
            {
                name: "Fsck",
                value: "fsck",
                description: "Run an integrity check over the memory store",
                action: "Run integrity check",
            },
            {
                name: "Lifecycle: Expire",
                value: "lifecycleExpire",
                description: "Run the context-category expiry sweep",
                action: "Run expiry sweep",
            },
            {
                name: "Lifecycle: Decay",
                value: "lifecycleDecay",
                description: "Run the importance decay sweep",
                action: "Run decay sweep",
            },
        ],
        default: "health",
    },
];

export const maintenanceFields: INodeProperties[] = [
    // Consolidate
    booleanField("dryRun", "Dry Run", {
        resource: RESOURCE,
        operations: ["consolidate", "elaborate"],
    }),
    numberField(
        "factLimit",
        "Fact Limit",
        { resource: RESOURCE, operations: ["consolidate"] },
        undefined,
    ),
    numberField(
        "observationLimit",
        "Observation Limit",
        { resource: RESOURCE, operations: ["consolidate"] },
        undefined,
    ),

    // Elaborate
    stringField("entityRef", "Entity Ref", {
        resource: RESOURCE,
        operations: ["elaborate"],
    }),
    numberField(
        "budget",
        "Budget",
        { resource: RESOURCE, operations: ["elaborate"] },
        undefined,
    ),
    booleanField("sweep", "Sweep", {
        resource: RESOURCE,
        operations: ["elaborate"],
    }),

    // Fsck
    stringField("check", "Check", { resource: RESOURCE, operations: ["fsck"] }),
    numberField(
        "duplicateThreshold",
        "Duplicate Threshold",
        { resource: RESOURCE, operations: ["fsck"] },
        undefined,
    ),
    numberField(
        "maxResults",
        "Max Results",
        { resource: RESOURCE, operations: ["fsck"] },
        undefined,
    ),

    // Inspect
    stringField(
        "ref",
        "Reference",
        { resource: RESOURCE, operations: ["inspect"] },
        {
            required: true,
            description: "Entity, attribute, or trace reference (e.g. person:tobie)",
        },
    ),

    additionalFieldsJson({ resource: RESOURCE, operations: ["inspect", "audit"] }),
];
