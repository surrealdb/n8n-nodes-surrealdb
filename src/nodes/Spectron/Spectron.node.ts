import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from "n8n-workflow";

import { spectronNodeProperties } from "./SpectronProperties";
import {
    createSpectronClient,
    validateAndResolveSpectronCredentials,
} from "./GenericFunctions";

import { handleKnowledgeOperations } from "./resources/knowledge";
import { handleSessionsOperations } from "./resources/sessions";
import { handleContextOperations } from "./resources/context";
import { handleMemoryOperations } from "./resources/memory";

export class Spectron implements INodeType {
    description: INodeTypeDescription = {
        displayName: "Spectron",
        name: "spectron",
        group: ["input"],
        version: 1,
        description:
            "Interact with the Spectron API (knowledge, sessions, context, memory)",
        defaults: {
            name: "Spectron",
        },
        inputs: ["main"],
        outputs: ["main"],
        usableAsTool: true,
        credentials: [
            {
                name: "spectronApi",
                required: true,
            },
        ],
        properties: spectronNodeProperties,
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const credentials = await this.getCredentials("spectronApi");
        const resolved = validateAndResolveSpectronCredentials(
            this,
            credentials,
        );
        const client = createSpectronClient(resolved);

        const items = this.getInputData();
        const resource = this.getNodeParameter("resource", 0) as string;
        const operation = this.getNodeParameter("operation", 0) as string;

        let returnData: INodeExecutionData[] = [];

        if (resource === "knowledge") {
            returnData = await handleKnowledgeOperations(
                operation,
                client,
                items,
                this,
            );
        } else if (resource === "sessions") {
            returnData = await handleSessionsOperations(
                operation,
                client,
                items,
                this,
            );
        } else if (resource === "context") {
            returnData = await handleContextOperations(
                operation,
                client,
                items,
                this,
            );
        } else if (resource === "memory") {
            returnData = await handleMemoryOperations(
                operation,
                client,
                items,
                this,
            );
        } else {
            throw new Error(`Unknown Spectron resource "${resource}"`);
        }

        return [returnData];
    }
}
