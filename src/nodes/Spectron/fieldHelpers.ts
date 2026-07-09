import type { INodeProperties } from "n8n-workflow";

/**
 * Small builders for n8n property fields that recur across Spectron resources.
 * Each takes the `resource`/`operation` values it should be shown for so the
 * n8n editor reveals it only for the relevant operations.
 */

interface ShowFor {
    resource: string;
    operations: string[];
}

function show({ resource, operations }: ShowFor) {
    return { show: { resource: [resource], operation: operations } };
}

/** A single-line string parameter. */
export function stringField(
    name: string,
    displayName: string,
    showFor: ShowFor,
    options: Partial<INodeProperties> = {},
): INodeProperties {
    return {
        displayName,
        name,
        type: "string",
        default: "",
        displayOptions: show(showFor),
        ...options,
    };
}

/** A multi-line text parameter (e.g. document text, chat messages). */
export function textField(
    name: string,
    displayName: string,
    showFor: ShowFor,
    options: Partial<INodeProperties> = {},
): INodeProperties {
    return {
        displayName,
        name,
        type: "string",
        typeOptions: { rows: 4 },
        default: "",
        displayOptions: show(showFor),
        ...options,
    };
}

/** A number parameter. */
export function numberField(
    name: string,
    displayName: string,
    showFor: ShowFor,
    def: number | undefined,
    options: Partial<INodeProperties> = {},
): INodeProperties {
    return {
        displayName,
        name,
        type: "number",
        default: def as number,
        displayOptions: show(showFor),
        ...options,
    };
}

/** A boolean parameter. */
export function booleanField(
    name: string,
    displayName: string,
    showFor: ShowFor,
    def = false,
    options: Partial<INodeProperties> = {},
): INodeProperties {
    return {
        displayName,
        name,
        type: "boolean",
        default: def,
        displayOptions: show(showFor),
        ...options,
    };
}

/** An options (dropdown) parameter. */
export function optionsField(
    name: string,
    displayName: string,
    showFor: ShowFor,
    choices: Array<{ name: string; value: string; description?: string }>,
    def: string,
    options: Partial<INodeProperties> = {},
): INodeProperties {
    return {
        displayName,
        name,
        type: "options",
        options: choices,
        default: def,
        displayOptions: show(showFor),
        ...options,
    };
}

/**
 * A DNF scope selector field. Accepts a bare path (`team/eng`), a comma list,
 * or a JSON array (`[["team/eng","org/acme"]]`). Parsed by `parseScope`.
 */
export function scopesField(
    showFor: ShowFor,
    name = "scopes",
    displayName = "Scopes",
): INodeProperties {
    return {
        displayName,
        name,
        type: "string",
        default: "",
        placeholder: 'e.g. team/eng or [["team/eng","org/acme"]]',
        description:
            "DNF scope selector. A bare path, a comma-separated list (OR), or a JSON array of clauses. Leave empty to use the key's default region.",
        displayOptions: show(showFor),
    };
}

/** A comma/newline-separated `key=value` labels field. */
export function labelsField(showFor: ShowFor): INodeProperties {
    return {
        displayName: "Labels",
        name: "labels",
        type: "string",
        default: "",
        placeholder: "e.g. project=acme, env=prod",
        description:
            "Comma or newline separated key=value labels to stamp onto the persisted rows",
        displayOptions: show(showFor),
    };
}

/**
 * An optional free-form JSON object merged into the SDK call for any option
 * without a dedicated field above.
 */
export function additionalFieldsJson(
    showFor: ShowFor,
    description = "Extra options passed through to the Spectron SDK, as a JSON object",
): INodeProperties {
    return {
        displayName: "Additional Fields (JSON)",
        name: "additionalFields",
        type: "json",
        default: "{}",
        description,
        displayOptions: show(showFor),
    };
}
