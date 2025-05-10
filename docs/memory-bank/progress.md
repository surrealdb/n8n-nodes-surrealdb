# Progress: n8n-nodes-surrealdb (as of Initial Onboarding)

## 1. What Works (Implemented Features)

Based on the `README.md` and the project's file structure (presence of operation files in `src/nodes/SurrealDb/resources/`), the following features are understood to be implemented and functional:

**Core Node Functionality:**
*   Functions as an n8n Action Node.
*   Functions as an n8n Tool Node (requires `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`).
*   Credential management for SurrealDB (HTTP/HTTPS, Root/Namespace/Database scopes).
*   Node-level overrides for namespace and database.

**Implemented Resources and Operations:**

*   **Record Operations:**
    *   Create Record
    *   Get Record
    *   Update Record
    *   Upsert Record
    *   Delete Record
*   **Table Operations:**
    *   Get All Records
    *   Create Many
    *   Get Many
    *   Update All Records
    *   Delete All Records
    *   Merge All Records
    *   Create Table
    *   Delete Table
    *   Get Table (info)
    *   List Tables (implied by `getTable` or general exploration capabilities, file `listTables.operation.ts` exists)
*   **Field Operations:**
    *   List Fields
    *   Create Field
    *   Delete Field
*   **Index Operations:**
    *   Create Index
    *   Delete Index (file `dropIndex.operation.ts` exists)
    *   Describe Index (file `describeIndex.operation.ts` exists)
    *   List Indexes (file `listIndexes.operation.ts` exists)
    *   Rebuild Index (file `rebuildIndex.operation.ts` exists)
*   **Relationship Operations:** (Marked as "Recently Implemented" in `FUTURE_TODO.md`)
    *   Create Relationship (using RELATE statement)
    *   Delete Relationship
    *   Query Relationships
*   **Query Operations:**
    *   Execute Query (raw SurrealQL with parameters)
*   **System Operations:**
    *   Health Check
    *   Version

## 2. What's Left to Build (Potential Future Enhancements)

This list is primarily derived from `docs/FUTURE_TODO.md`:

*   **Authentication Resource:** signUp, signIn, signOut, authenticate, info.
*   **User Resource:** createUser, getUser, updateUser, deleteUser, listUsers (for system/database users).
*   **Access/Scope Resource:** defineAccess, getAccess, updateAccess, deleteAccess, listAccess.
*   **Event Resource:** defineEvent, getEvent, updateEvent, deleteEvent, listEvents.
*   **Function Resource:** defineFunction, getFunction, updateFunction, deleteFunction, listFunctions.
*   **Schema Definition Resource (more comprehensive):**
    *   `defineTable` (potentially more advanced schema definition beyond basic create).
    *   `defineField` (potentially more advanced schema definition).
    *   `defineIndex` (potentially more advanced schema definition).
    *   `defineAnalyzer`.
*   **Transaction Resource:** beginTransaction, commitTransaction, cancelTransaction.
*   **Live Query Resource:** liveListen, liveQuery (Challenging due to HTTP-only constraint).
*   **Patch Operations:** patchRecord (JSON Patch), patchAllRecords.
*   **Insert Operations (distinct from Upsert/Create):** insertRecord, insertMany.
*   **Variable Operations:** setVariable, getVariable, removeVariable.
*   **Permission Resource:** definePermission, getPermission, updatePermission, deletePermission, listPermissions.
*   **Analyzer Resource:** defineAnalyzer, getAnalyzer, updateAnalyzer, deleteAnalyzer, listAnalyzers.
*   **Namespace/Database Management Operations:** createNamespace, useNamespace, deleteNamespace, listNamespaces, createDatabase, useDatabase, deleteDatabase, listDatabases.
*   **Graph Operations (Advanced):** traverseGraph, shortestPath, findConnections.

## 3. Current Status

*   **Foundation Established:** The node has a solid foundation with a wide range of common SurrealDB operations implemented.
*   **Actively Maintained (Implied):** The presence of `CHANGELOG.md` and recent additions like "Relationship Resource" suggest ongoing development.
*   **Ready for Use:** The node is published on npm (`v0.2.0` as per `package.json`) and usable in self-hosted n8n instances.
*   **Memory Bank Initialized:** Core memory bank files have been created by Cline for easier future onboarding and development.

## 4. Known Issues & Limitations

*   **HTTP/HTTPS Only:** Cannot use WebSocket (WS/WSS) connections. This limits real-time capabilities and might affect how certain SurrealDB features are accessed or if the `surrealdb.js` library can be fully leveraged.
*   **Self-Hosted n8n Only:** Not available for n8n Cloud users.
*   **SurrealDB Result Handling:** Users need to be aware that SurrealDB often returns empty results instead of errors for "not found" scenarios. The node should ideally make this clear or handle it gracefully (e.g., via n8n's "Always Output Data" option).
*   **Tool Node Usage Prerequisite:** Requires `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true` environment variable.

## 5. Evolution of Project Decisions (Initial Observations)

*   **Initial Focus on Core CRUD and Querying:** The existing operations cover the fundamental interactions with a database.
*   **Expansion into Relational/Graph Features:** The recent addition of "Relationship Resource" indicates a move towards supporting SurrealDB's multi-model capabilities more deeply.
*   **Adherence to n8n Structure:** The project has consistently followed n8n's architectural patterns for community nodes (resource/operation structure, credential handling, JSON definitions).
*   **Addressing Limitations:** The explicit mention of HTTP-only and self-hosted only in `README.md` shows an awareness and communication of existing constraints.
