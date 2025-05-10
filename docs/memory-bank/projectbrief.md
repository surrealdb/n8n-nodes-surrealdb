# Project Brief: n8n-nodes-surrealdb

## 1. Project Overview

**Project Name:** n8n-nodes-surrealdb
**Project Type:** Community Node for n8n (Workflow Automation Platform)
**Integration Target:** SurrealDB (Multi-model Database)

**Core Purpose:** To enable n8n users to seamlessly interact with SurrealDB instances from within their workflows. This includes performing data manipulation (CRUD), executing custom queries, and managing database structures like tables, fields, and indexes. The node aims to function both as a standard action node for workflow steps and as a tool node for AI-driven workflows.

## 2. Core Requirements & Goals

### Functional Requirements:
*   **Dual Node Functionality:**
    *   **Action Node:** Allow users to configure specific SurrealDB operations as steps in an n8n workflow.
    *   **Tool Node:** Enable AI agents within n8n to utilize SurrealDB functionalities.
*   **Comprehensive SurrealDB Operations:**
    *   **Record Operations:** Create, Get, Update, Upsert, Delete single records.
    *   **Table Operations:** Get All Records, Create Many, Get Many, Update All Records, Delete All Records, Merge All Records, Create Table, Delete Table, Get Table Info.
    *   **Field Operations:** List Fields, Create Field, Delete Field.
    *   **Index Operations:** Create Index, Delete Index.
    *   **Relationship Operations:** Create Relationship, Delete Relationship, Query Relationships.
    *   **Query Operations:** Execute raw SurrealQL queries with parameter support.
    *   **System Operations:** Health Check, Get Version.
*   **Credential Management:** Securely handle SurrealDB connection details (Connection String, Authentication Scope, Username, Password, Namespace, Database).
*   **Authentication Support:** Support Root, Namespace, and Database level authentication scopes for SurrealDB.
*   **Configuration Flexibility:** Allow overriding namespace and database settings at the node level for specific operations.
*   **Data Handling:** Work natively with SurrealDB data formats and map them effectively to n8n's JSON-based data handling.
*   **Error Handling:** Provide clear error messages and manage SurrealDB's behavior of returning empty results for non-existent data (e.g., via "Always Output Data" option).

### Non-Functional Requirements:
*   **Compatibility:**
    *   n8n: Self-hosted instances, v0.214.0 or later recommended.
    *   SurrealDB: v1.0.0 or later recommended (tested with v2.x).
*   **Connection Protocol:** Must use HTTP/HTTPS for SurrealDB connections due to n8n architecture limitations. WebSocket (WS/WSS) connections are not supported.
*   **Usability:** Provide a clear and intuitive user interface within n8n for configuring nodes and operations.
*   **Documentation:** Maintain clear documentation on installation, configuration, operations, and limitations.
*   **Community Standards:** Adhere to n8n community node development best practices.

### Project Goals:
*   Provide a robust and reliable integration between n8n and SurrealDB.
*   Cover a wide range of common SurrealDB use cases through pre-defined operations.
*   Offer flexibility for advanced users via custom SurrealQL query execution.
*   Enable n8n users to leverage SurrealDB's capabilities in their automation workflows and AI applications.
*   Maintain the node with updates and bug fixes as SurrealDB and n8n evolve.

## 3. Scope

**In Scope:**
*   Implementation of all listed SurrealDB operations.
*   Credential handling for HTTP/HTTPS connections.
*   Functionality as both an n8n action node and a tool node.
*   Documentation covering setup, usage, and development.

**Out of Scope (Explicitly Mentioned Limitations):**
*   Support for n8n Cloud (works with self-hosted n8n only).
*   Support for WebSocket (WS/WSS) connections to SurrealDB.
*   Direct support for SurrealDB features that are exclusively available via WebSocket (if any beyond connection statefulness).

## 4. Key Stakeholders/Users

*   **Primary Users:** Developers and IT professionals using self-hosted n8n instances who need to integrate SurrealDB into their workflows.
*   **Secondary Users:** AI developers using n8n's AI capabilities who require tools to interact with SurrealDB.
*   **Maintainers/Contributors:** Developers contributing to the `n8n-nodes-surrealdb` community node.

## 5. Important Considerations from README

*   **Tool Node Activation:** Requires environment variable `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true`.
*   **SurrealDB Result Handling:** Be mindful that SurrealDB often returns empty results instead of errors for "not found" scenarios. The "Always Output Data" n8n option is relevant here.
