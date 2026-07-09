import type { INodeProperties } from "n8n-workflow";
import {
    additionalFieldsJson,
    booleanField,
    labelsField,
    numberField,
    optionsField,
    scopesField,
    stringField,
    textField,
} from "../../fieldHelpers";

const RESOURCE = "memory";

export const memoryOperations: INodeProperties[] = [
    {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: [RESOURCE] } },
        options: [
            {
                name: "Remember",
                value: "remember",
                description:
                    "Persist facts from free text and/or caller-supplied triples",
                action: "Remember facts",
            },
            {
                name: "Remember Many",
                value: "rememberMany",
                description: "Persist facts from a batch of conversation messages",
                action: "Remember many messages",
            },
            {
                name: "Recall",
                value: "recall",
                description: "Semantic recall over memory for this context",
                action: "Recall memory",
            },
            {
                name: "Context",
                value: "context",
                description: "Retrieve LLM-facing context text for a query",
                action: "Get context",
            },
            {
                name: "Reflect",
                value: "reflect",
                description: "Run a reflection pass, optionally persisting attributes",
                action: "Reflect on memory",
            },
            {
                name: "Forget",
                value: "forget",
                description: "Forget memory matching a natural-language query",
                action: "Forget memory",
            },
            {
                name: "Chat",
                value: "chat",
                description:
                    "Full chat round trip, returning the reply plus memory updates",
                action: "Chat",
            },
        ],
        default: "remember",
    },
];

export const memoryFields: INodeProperties[] = [
    // Remember
    textField("text", "Text", { resource: RESOURCE, operations: ["remember"] }, {
        description:
            "Free-form text to extract facts from. Optional when supplying triples via Additional Fields.",
    }),
    optionsField(
        "infer",
        "Infer Mode",
        { resource: RESOURCE, operations: ["remember", "rememberMany"] },
        [
            { name: "Full", value: "full" },
            { name: "Triples", value: "triples" },
            { name: "Preview", value: "preview" },
            { name: "None", value: "none" },
        ],
        "full",
    ),
    optionsField(
        "role",
        "Role",
        { resource: RESOURCE, operations: ["remember"] },
        [
            { name: "User", value: "user" },
            { name: "Assistant", value: "assistant" },
            { name: "System", value: "system" },
            { name: "Tool", value: "tool" },
        ],
        "user",
    ),
    optionsField(
        "memoryCategory",
        "Memory Category",
        { resource: RESOURCE, operations: ["remember"] },
        [
            { name: "(Default)", value: "" },
            { name: "Identity", value: "identity" },
            { name: "Knowledge", value: "knowledge" },
            { name: "Context", value: "context" },
        ],
        "",
    ),

    // Remember Many
    {
        displayName: "Messages (JSON)",
        name: "messages",
        type: "json",
        default: "[]",
        placeholder: '[{"role":"user","content":"I moved to Lisbon"}]',
        description:
            "Array of conversation messages ({ role, content }) to persist facts from",
        displayOptions: {
            show: { resource: [RESOURCE], operation: ["rememberMany"] },
        },
    },
    optionsField(
        "extract",
        "Extraction Mode",
        { resource: RESOURCE, operations: ["rememberMany"] },
        [
            { name: "(Default)", value: "" },
            { name: "Per Message", value: "per_message" },
            { name: "Whole Conversation", value: "whole_conversation" },
        ],
        "",
    ),

    // Recall / Context shared query
    textField(
        "query",
        "Query",
        {
            resource: RESOURCE,
            operations: ["recall", "context", "reflect", "forget"],
        },
        { required: true },
    ),
    numberField(
        "k",
        "Max Results (k)",
        { resource: RESOURCE, operations: ["recall", "context"] },
        10,
    ),
    stringField(
        "mode",
        "Retrieval Mode",
        { resource: RESOURCE, operations: ["recall"] },
        {
            default: "hybrid",
            description: "Retrieval mode (e.g. hybrid, vector, bm25)",
        },
    ),
    optionsField(
        "scopeView",
        "Scope View",
        { resource: RESOURCE, operations: ["recall", "context"] },
        [
            { name: "Strict", value: "strict" },
            { name: "Merged", value: "merged" },
            { name: "Cross Team", value: "crossTeam" },
        ],
        "strict",
    ),
    scopesField(
        { resource: RESOURCE, operations: ["recall", "context"] },
        "lens",
        "Lens (Read Scope)",
    ),

    // Reflect
    booleanField(
        "persist",
        "Persist",
        { resource: RESOURCE, operations: ["reflect"] },
        false,
        { description: "Whether to persist attributes discovered by the reflection" },
    ),

    // Forget
    booleanField(
        "purge",
        "Purge",
        { resource: RESOURCE, operations: ["forget"] },
        false,
        { description: "Whether to hard-delete matched rows instead of tombstoning" },
    ),

    // Chat
    textField("message", "Message", {
        resource: RESOURCE,
        operations: ["chat"],
    }, { required: true }),
    stringField(
        "model",
        "Model",
        { resource: RESOURCE, operations: ["chat"] },
        { description: "Optional model override" },
    ),
    booleanField(
        "bypassCache",
        "Bypass Cache",
        { resource: RESOURCE, operations: ["chat"] },
        false,
        { description: "Skip the response cache and force a fresh call" },
    ),

    // Shared across write/session-aware ops
    stringField(
        "sessionId",
        "Session ID",
        {
            resource: RESOURCE,
            operations: ["remember", "rememberMany", "recall", "chat"],
        },
        { description: "Existing session to attach this call to" },
    ),
    scopesField({
        resource: RESOURCE,
        operations: ["remember", "rememberMany", "chat"],
    }),
    labelsField({
        resource: RESOURCE,
        operations: ["remember", "rememberMany", "recall", "context", "chat"],
    }),
    additionalFieldsJson({
        resource: RESOURCE,
        operations: [
            "remember",
            "rememberMany",
            "recall",
            "context",
            "chat",
        ],
    }),
];
