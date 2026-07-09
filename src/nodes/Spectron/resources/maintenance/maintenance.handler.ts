import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type {
    ISpectronCredentials,
    SpectronOperation,
} from "../../types/spectron.types";
import {
    getItemParam,
    parseJsonObject,
    pushResult,
    requireString,
    runOperations,
} from "../../GenericFunctions";

function optionalNumber(
    executeFunctions: IExecuteFunctions,
    name: string,
    itemIndex: number,
): number | undefined {
    const value = getItemParam<number | undefined>(
        executeFunctions,
        name,
        itemIndex,
        undefined,
    );
    return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
}

const operations: Record<string, SpectronOperation> = {
    async health({ client, itemIndex, returnData }) {
        await client.health();
        pushResult(returnData, { healthy: true }, itemIndex);
    },

    async state({ client, itemIndex, returnData }) {
        const result = await client.state();
        pushResult(returnData, result, itemIndex);
    },

    async profile({ client, itemIndex, returnData }) {
        const result = await client.profile();
        pushResult(returnData, result, itemIndex);
    },

    async whoami({ client, itemIndex, returnData }) {
        const result = await client.whoami();
        pushResult(returnData, result, itemIndex);
    },

    async inspect({ client, executeFunctions, itemIndex, returnData }) {
        const ref = requireString(executeFunctions, "ref", itemIndex, "Reference");
        const options = parseJsonObject(
            getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
            "Additional Fields (JSON)",
        );
        const result = await client.inspect(ref, options);
        pushResult(returnData, result, itemIndex);
    },

    async audit({ client, executeFunctions, itemIndex, returnData }) {
        const options = parseJsonObject(
            getItemParam<string>(executeFunctions, "additionalFields", itemIndex, "{}"),
            "Additional Fields (JSON)",
        );
        const result = await client.audit(options);
        pushResult(returnData, result, itemIndex);
    },

    async consolidate({ client, executeFunctions, itemIndex, returnData }) {
        const result = await client.consolidate({
            dryRun: getItemParam<boolean>(executeFunctions, "dryRun", itemIndex, false),
            factLimit: optionalNumber(executeFunctions, "factLimit", itemIndex),
            observationLimit: optionalNumber(
                executeFunctions,
                "observationLimit",
                itemIndex,
            ),
        });
        pushResult(returnData, result, itemIndex);
    },

    async elaborate({ client, executeFunctions, itemIndex, returnData }) {
        const entityRef = getItemParam<string>(
            executeFunctions,
            "entityRef",
            itemIndex,
            "",
        ).trim();
        const result = await client.elaborate({
            entityRef: entityRef || undefined,
            budget: optionalNumber(executeFunctions, "budget", itemIndex),
            sweep: getItemParam<boolean>(executeFunctions, "sweep", itemIndex, false),
            dryRun: getItemParam<boolean>(executeFunctions, "dryRun", itemIndex, false),
        });
        pushResult(returnData, result, itemIndex);
    },

    async fsck({ client, executeFunctions, itemIndex, returnData }) {
        const check = getItemParam<string>(executeFunctions, "check", itemIndex, "").trim();
        const result = await client.fsck({
            check: check || undefined,
            duplicateThreshold: optionalNumber(
                executeFunctions,
                "duplicateThreshold",
                itemIndex,
            ),
            maxResults: optionalNumber(executeFunctions, "maxResults", itemIndex),
        });
        pushResult(returnData, result, itemIndex);
    },

    async lifecycleExpire({ client, itemIndex, returnData }) {
        const result = await client.lifecycle.expire();
        pushResult(returnData, result, itemIndex);
    },

    async lifecycleDecay({ client, itemIndex, returnData }) {
        const result = await client.lifecycle.decay();
        pushResult(returnData, result, itemIndex);
    },
};

export async function handleMaintenanceOperations(
    client: Spectron,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    credentials: ISpectronCredentials,
): Promise<INodeExecutionData[]> {
    return runOperations(operations, "Maintenance", {
        client,
        credentials,
        items,
        executeFunctions,
    });
}
