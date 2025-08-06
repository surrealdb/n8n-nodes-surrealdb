import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import { getGlobalConnectionPool } from "../../../ConnectionPool";
import { createErrorResult } from "../../../utilities";

/**
 * Get connection pool statistics operation
 */
export const poolStatsOperation = {
    async execute(
        client: Surreal,
        items: INodeExecutionData[],
        executeFunctions: IExecuteFunctions,
        itemIndex: number,
    ): Promise<INodeExecutionData[]> {
        try {
            // Get the global connection pool
            const connectionPool = getGlobalConnectionPool();

            // Get pool statistics
            const stats = connectionPool.getStats();

            // Create result with detailed statistics
            const result = {
                poolStatistics: {
                    totalConnections: stats.totalConnections,
                    activeConnections: stats.activeConnections,
                    idleConnections: stats.idleConnections,
                    waitingRequests: stats.waitingRequests,
                    totalRequests: stats.totalRequests,
                    failedRequests: stats.failedRequests,
                    averageResponseTime: Math.round(stats.averageResponseTime),
                    successRate:
                        stats.totalRequests > 0
                            ? Math.round(
                                  ((stats.totalRequests -
                                      stats.failedRequests) /
                                      stats.totalRequests) *
                                      100,
                              )
                            : 100,
                    poolUtilization: stats.poolUtilization,
                    connectionErrors: stats.connectionErrors,
                    healthCheckFailures: stats.healthCheckFailures,
                },
                performance: {
                    averageResponseTimeMs: Math.round(
                        stats.averageResponseTime,
                    ),
                    requestsPerSecond:
                        stats.totalRequests > 0
                            ? Math.round(
                                  stats.totalRequests / (Date.now() / 1000),
                              )
                            : 0,
                    errorRate:
                        stats.totalRequests > 0
                            ? Math.round(
                                  (stats.failedRequests / stats.totalRequests) *
                                      100,
                              )
                            : 0,
                    connectionErrorRate:
                        stats.totalRequests > 0
                            ? Math.round(
                                  (stats.connectionErrors /
                                      stats.totalRequests) *
                                      100,
                              )
                            : 0,
                },
                poolHealth: {
                    utilizationRate: stats.poolUtilization,
                    availableConnections: stats.idleConnections,
                    waitingRequests: stats.waitingRequests,
                    healthCheckFailures: stats.healthCheckFailures,
                    connectionErrors: stats.connectionErrors,
                },
                timestamp: new Date().toISOString(),
            };

            return [
                {
                    json: result,
                    pairedItem: {
                        item: itemIndex,
                    },
                },
            ];
        } catch (error) {
            return [createErrorResult(error as Error, itemIndex)];
        }
    },
};
