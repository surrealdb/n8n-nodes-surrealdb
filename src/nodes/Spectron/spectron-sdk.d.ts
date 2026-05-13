declare module "@surrealdb/spectron" {
    export interface SpectronOptions {
        endpoint?: string;
        baseUrl?: string;
        apiKey: string;
        context: string;
        timeout?: number;
        maxRetries?: number;
        // eslint-disable-next-line no-undef
        fetchImpl?: typeof fetch;
    }

    export interface SpectronKnowledgeUploadInput {
        file: unknown;
        title?: string;
        [key: string]: unknown;
    }

    export interface SpectronKnowledgeListInput {
        [key: string]: unknown;
    }

    export interface SpectronKnowledge {
        upload(input: SpectronKnowledgeUploadInput): Promise<unknown>;
        list(input?: SpectronKnowledgeListInput): Promise<unknown>;
        delete(id: string): Promise<unknown>;
    }

    export interface SpectronTurnInput {
        role: string;
        content: string;
        [key: string]: unknown;
    }

    export interface SpectronSession {
        id: string;
        turn(input: SpectronTurnInput): Promise<unknown>;
    }

    export interface SpectronSessionsCreateInput {
        scope?: Record<string, unknown>;
        [key: string]: unknown;
    }

    export interface SpectronSessions {
        create(input?: SpectronSessionsCreateInput): Promise<SpectronSession>;
        get(id: string): Promise<SpectronSession>;
    }

    export interface SpectronContextQueryInput {
        query: string;
        [key: string]: unknown;
    }

    export interface SpectronContextRetrieveInput {
        [key: string]: unknown;
    }

    export interface SpectronContext {
        query(input: SpectronContextQueryInput): Promise<unknown>;
        retrieve(input?: SpectronContextRetrieveInput): Promise<unknown>;
    }

    export interface SpectronMemory {
        profile(input?: Record<string, unknown>): Promise<unknown>;
        reflect(input?: Record<string, unknown>): Promise<unknown>;
    }

    export class Spectron {
        constructor(options: SpectronOptions);
        knowledge: SpectronKnowledge;
        sessions: SpectronSessions;
        context: SpectronContext;
        memory: SpectronMemory;
    }
}
