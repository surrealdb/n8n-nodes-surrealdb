import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import type { Surreal } from "surrealdb";
import {
  prepareSurrealQuery,
  buildCredentialsObject,
} from "../../../GenericFunctions";
import { debugLog } from "../../../utilities";
import type { IOperationHandler } from "../../../types/operation.types";

import { DEBUG } from '../../../debug';

/**
 * Implementation of the "Query Relationships" operation
 * This operation queries relationships for a record
 */
export const queryRelationshipsOperation: IOperationHandler = {
  async execute(
    client: Surreal,
    items: INodeExecutionData[],
    executeFunctions: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];

    if (DEBUG) debugLog("queryRelationships", "Starting operation", itemIndex);

    // Get credentials
    const credentials = await executeFunctions.getCredentials("surrealDbApi");

    // Get parameters
    const recordId = executeFunctions.getNodeParameter(
      "recordId",
      itemIndex,
      "",
    ) as string;
    const direction = executeFunctions.getNodeParameter(
      "direction",
      itemIndex,
    ) as string;
    const relationshipType = executeFunctions.getNodeParameter(
      "relationshipType",
      itemIndex,
      "",
    ) as string;

    // Validate relationship type if record ID is not provided
    if (!recordId && !relationshipType) {
      throw new NodeOperationError(
        executeFunctions.getNode(),
        `When Record ID is not provided, Relationship Type is required`,
        { itemIndex },
      );
    }

    // Validate record ID format if provided
    if (recordId && !recordId.includes(":")) {
      throw new NodeOperationError(
        executeFunctions.getNode(),
        `Record ID must be in the format "table:id" (e.g., person:john)`,
        { itemIndex },
      );
    }

    // Get options
    const options = executeFunctions.getNodeParameter(
      "options",
      itemIndex,
      {},
    ) as IDataObject;

    // Build the resolved credentials object using the utility function
    const resolvedCredentials = buildCredentialsObject(credentials, options);

    // Determine the direction symbol
    let directionSymbol = "";
    switch (direction) {
      case "outgoing":
        directionSymbol = "->";
        break;
      case "incoming":
        directionSymbol = "<-";
        break;
      case "both":
        directionSymbol = "<->";
        break;
      default:
        throw new NodeOperationError(
          executeFunctions.getNode(),
          `Invalid direction: ${direction}`,
          { itemIndex },
        );
    }

    // Determine the relationship part of the query
    const relationshipPart = relationshipType ? relationshipType : "?";

    // Determine the target table part of the query
    const targetTable = options.targetTable ? options.targetTable : "?";

    // Determine if we should include properties
    const includeProperties = options.includeProperties !== false;

    // Determine if we should split results into items
    const splitIntoItems = options.splitIntoItems === true;

    // Build the query
    let query = "";

    // If no record ID is provided, query all relationships of the specified type
    if (!recordId) {
      if (includeProperties) {
        // Query that returns all relationships of the specified type
        query = `SELECT * FROM ${relationshipType};`;
      } else {
        // Query that returns just the source and target records
        query = `SELECT id, in, out FROM ${relationshipType};`;
      }
    } else {
      // If record ID is provided, query relationships for that record
      if (includeProperties) {
        // Query that returns full relationship details
        query = `SELECT ${directionSymbol}${relationshipPart}${directionSymbol}${targetTable} AS relationships FROM ${recordId};`;
      } else {
        // Query that returns just the related records
        query = `SELECT ${directionSymbol}${relationshipPart}${directionSymbol}${targetTable}.id AS related_records FROM ${recordId};`;
      }
    }

    const preparedQuery = prepareSurrealQuery(query, resolvedCredentials);

    if (DEBUG) {
      // DEBUG: Log query
      debugLog(
        "queryRelationships",
        "Prepared query",
        itemIndex,
        preparedQuery,
      );
    }

    // Execute the query
    const result = await client.query(preparedQuery);

    if (DEBUG) {
      // DEBUG: Log raw result
      debugLog(
        "queryRelationships",
        "Raw query result",
        itemIndex,
        JSON.stringify(result),
      );
    }

    // Process the result
    if (Array.isArray(result) && result.length > 0) {
      const queryResult = result[0];

      if (queryResult === null) {
        throw new NodeOperationError(
          executeFunctions.getNode(),
          `Failed to query relationships${recordId ? ` for ${recordId}` : ""}`,
          { itemIndex },
        );
      }

      // Handle different result formats based on the query structure
      if (splitIntoItems) {
        // Split results into individual items
        let relationships: unknown[] = [];

        // Extract relationships from the result based on the query structure
        if (!recordId) {
          // When no record ID is provided, the result is already an array of relationships
          relationships = Array.isArray(queryResult)
            ? queryResult
            : [queryResult];
        } else if (
          queryResult &&
          typeof queryResult === "object" &&
          "relationships" in queryResult
        ) {
          // When using the "relationships" alias
          const rels = (queryResult as IDataObject).relationships;
          relationships = Array.isArray(rels) ? rels : [rels];
        } else if (
          queryResult &&
          typeof queryResult === "object" &&
          "related_records" in queryResult
        ) {
          // When using the "related_records" alias
          const rels = (queryResult as IDataObject).related_records;
          relationships = Array.isArray(rels) ? rels : [rels];
        } else {
          // Fallback - just use the query result
          relationships = [queryResult];
        }

        // Return each relationship as a separate item
        for (const relationship of relationships) {
          if (relationship !== null && relationship !== undefined) {
            returnData.push({
              json: relationship as IDataObject,
              pairedItem: { item: itemIndex },
            });
          }
        }

        // If no relationships were found, return an empty result
        if (returnData.length === 0) {
          returnData.push({
            json: {
              message: `No relationships found${recordId ? ` for ${recordId}` : ""
                }`,
            },
            pairedItem: { item: itemIndex },
          });
        }
      } else {
        // Return all relationships as a single item
        returnData.push({
          json: queryResult as IDataObject,
          pairedItem: { item: itemIndex },
        });
      }
    } else {
      throw new NodeOperationError(
        executeFunctions.getNode(),
        `Failed to query relationships${recordId ? ` for ${recordId}` : ""}`,
        { itemIndex },
      );
    }

    return returnData;
  },
};
