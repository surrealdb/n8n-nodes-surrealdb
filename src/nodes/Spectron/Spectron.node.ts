import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";

import { spectronNodeProperties } from "./SpectronProperties";
import {
    createSpectronClient,
    validateAndResolveSpectronCredentials,
} from "./GenericFunctions";

import { handleMemoryOperations } from "./resources/memory";
import { handleDocumentOperations } from "./resources/document";
import { handleKeywordOperations } from "./resources/keyword";
import { handleEntityOperations } from "./resources/entity";
import { handleSessionOperations } from "./resources/session";
import { handleTraceOperations } from "./resources/trace";
import { handlePrincipalOperations } from "./resources/principal";
import { handleScopeOperations } from "./resources/scope";
import { handleKeyOperations } from "./resources/key";
import { handleMaintenanceOperations } from "./resources/maintenance";

const resourceHandlers = {
    memory: handleMemoryOperations,
    document: handleDocumentOperations,
    keyword: handleKeywordOperations,
    entity: handleEntityOperations,
    session: handleSessionOperations,
    trace: handleTraceOperations,
    principal: handlePrincipalOperations,
    scope: handleScopeOperations,
    key: handleKeyOperations,
    maintenance: handleMaintenanceOperations,
};

export class Spectron implements INodeType {
    description: INodeTypeDescription = {
        displayName: "Spectron",
        name: "spectron",
        icon: "file:spectron.png",
        group: ["input"],
        version: 1,
        description:
            "Interact with the Spectron API: memory, documents, entities, sessions, traces, and governance",
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

        const handler =
            resourceHandlers[resource as keyof typeof resourceHandlers];
        if (!handler) {
            throw new NodeOperationError(
                this.getNode(),
                `Unknown Spectron resource "${resource}"`,
            );
        }

        const returnData = await handler(client, items, this, resolved);
        return [returnData];
    }
}
