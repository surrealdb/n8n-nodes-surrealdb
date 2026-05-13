import type { INodeProperties } from "n8n-workflow";

export const memoryOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ["memory"],
            },
        },
        options: [
            {
                name: "Profile",
                value: "profile",
                description: "Read or update the memory profile",
                action: "Profile memory",
            },
            {
                name: "Reflect",
                value: "reflect",
                description: "Trigger a memory reflection",
                action: "Reflect on memory",
            },
        ],
        default: "profile",
    },
];

export const memoryFields: INodeProperties[] = [
    {
        displayName: "Input",
        name: "memoryInput",
        type: "json",
        default: "{}",
        description:
            "Optional input forwarded to the memory operation (JSON object)",
        displayOptions: {
            show: {
                resource: ["memory"],
                operation: ["profile", "reflect"],
            },
        },
    },
];
