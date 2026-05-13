import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Spectron } from "@surrealdb/spectron";
import type { ISpectronOperationHandler } from "../../../types/spectron.types";
import { pushResult } from "../../../GenericFunctions";

export const uploadOperation: ISpectronOperationHandler = {
    async execute(
        client: Spectron,
        _items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];

        const binaryPropertyName = executeFunctions.getNodeParameter(
            "binaryPropertyName",
            itemIndex,
            "data",
        ) as string;
        const title = executeFunctions.getNodeParameter(
            "title",
            itemIndex,
            "",
        ) as string;
        const additionalFieldsRaw = executeFunctions.getNodeParameter(
            "additionalFields",
            itemIndex,
            "{}",
        ) as string;

        const binary = await executeFunctions.helpers.getBinaryDataBuffer(
            itemIndex,
            binaryPropertyName,
        );
        const binaryMeta =
            executeFunctions.helpers.assertBinaryData(
                itemIndex,
                binaryPropertyName,
            );

        let additionalFields: Record<string, unknown> = {};
        if (additionalFieldsRaw && additionalFieldsRaw.trim() !== "") {
            try {
                additionalFields = JSON.parse(additionalFieldsRaw);
            } catch (e) {
                throw new Error(
                    `Invalid JSON in "Additional Fields": ${(e as Error).message}`,
                );
            }
        }

        const file =
            typeof File !== "undefined"
                ? new File(
                      [new Uint8Array(binary)],
                      binaryMeta.fileName ?? "upload",
                      { type: binaryMeta.mimeType },
                  )
                : binary;

        const result = await client.knowledge.upload({
            file,
            title: title || binaryMeta.fileName || undefined,
            ...additionalFields,
        });

        pushResult(returnData, result, itemIndex);
        return returnData;
    },
};
