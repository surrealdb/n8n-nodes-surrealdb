export interface IBatchConfig {
    batchSize: number;
    parallel: boolean;
    maxParallelBatches: number;
    errorHandling: "stop" | "continue" | "partial";
    transaction: boolean;
    progressTracking: boolean;
}

export interface IBatchResult {
    success: boolean;
    data?: unknown;
    error?: string;
    batchIndex: number;
    processedCount: number;
}

/**
 * Simple semaphore implementation for limiting concurrent operations
 */
export class Semaphore {
    private permits: number;
    private waitQueue: Array<() => void> = [];

    constructor(permits: number) {
        this.permits = permits;
    }

    async acquire(): Promise<() => void> {
        if (this.permits > 0) {
            this.permits--;
            return () => this.release();
        }

        return new Promise<() => void>(resolve => {
            this.waitQueue.push(() => {
                this.permits--;
                resolve(() => this.release());
            });
        });
    }

    private release(): void {
        this.permits++;
        if (this.waitQueue.length > 0) {
            const next = this.waitQueue.shift();
            if (next) next();
        }
    }
}

/**
 * Process batches with configurable parallel/sequential processing
 */
export async function processBatches<T>(
    batches: T[][],
    batchProcessor: (batch: T[], batchIndex: number) => Promise<IBatchResult>,
    batchConfig: IBatchConfig,
): Promise<{
    results: IBatchResult[];
    totalProcessed: number;
    totalErrors: number;
}> {
    const results: IBatchResult[] = [];
    let totalProcessed = 0;
    let totalErrors = 0;

    if (batchConfig.parallel) {
        // Parallel processing
        const semaphore = new Semaphore(batchConfig.maxParallelBatches);
        const batchPromises = batches.map((batch, batchIndex) => {
            const processBatch = async (release: () => void) => {
                try {
                    const result = await batchProcessor(batch, batchIndex);
                    results.push(result);
                    totalProcessed += result.processedCount;
                    if (!result.success) totalErrors++;
                    return result;
                } finally {
                    release();
                }
            };
            return semaphore.acquire().then(processBatch);
        });

        await Promise.all(batchPromises);
    } else {
        // Sequential processing
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const result = await batchProcessor(batch, batchIndex);

            results.push(result);
            totalProcessed += result.processedCount;
            if (!result.success) totalErrors++;

            // Handle error based on configuration
            if (!result.success && batchConfig.errorHandling === "stop") {
                throw new Error(
                    `Batch ${batchIndex + 1} failed: ${result.error}`,
                );
            }
        }
    }

    return { results, totalProcessed, totalErrors };
}

/**
 * Split array into batches of specified size
 */
export function splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
        batches.push(array.slice(i, i + batchSize));
    }
    return batches;
}

/**
 * Create a standardized batch result
 */
export function createBatchResult(
    success: boolean,
    data: unknown,
    batchIndex: number,
    processedCount: number,
    error?: string,
): IBatchResult {
    return {
        success,
        data,
        batchIndex,
        processedCount,
        error,
    };
}
