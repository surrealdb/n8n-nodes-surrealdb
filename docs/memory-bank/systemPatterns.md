# System Patterns: n8n-nodes-surrealdb

## 1. System Architecture

The `n8n-nodes-surrealdb` project is a community node designed to integrate with the n8n workflow automation platform. Its architecture is dictated by n8n's node development standards.

**High-Level View:**

```mermaid
graph TD
    User[n8n User] -- Configures --> n8nWorkflow[n8n Workflow]
    n8nWorkflow -- Invokes --> SurrealDbNode[SurrealDB Node (this project)]
    SurrealDbNode -- Uses --> SurrealDbCredentials[SurrealDbApi.credentials.ts]
    SurrealDbNode -- HTTP/HTTPS --> SurrealDbInstance[SurrealDB Instance]
    SurrealDbCredentials -- Stores/Retrieves --> n8nCredentialStore[n8n Credential Store]

    subgraph n8n-nodes-surrealdb
        SurrealDbNode
        SurrealDbCredentials
        NodeLogic[SurrealDb.node.ts]
        NodeDescription[SurrealDb.node.json]
        ResourceHandlers[resources/]
    end

    NodeLogic -- Uses --> ResourceHandlers
    ResourceHandlers -- Define --> Operations[operations/]
```

**Key Architectural Components:**

1.  **n8n Core:** The underlying n8n platform that hosts and executes community nodes. This project runs within the n8n environment.
2.  **SurrealDB Node (`SurrealDb.node.ts`):** The main entry point and orchestrator for the node's functionality. It implements the `INodeType` interface from n8n.
    *   Defines the node's properties, description, and methods (e.g., `execute`).
    *   Handles routing of operations to appropriate resource handlers.
3.  **Node Description (`SurrealDb.node.json`):** A JSON file that defines the node's metadata, properties, input fields, and UI elements as they appear in the n8n editor. This is crucial for how users interact with the node.
4.  **Credentials (`SurrealDbApi.credentials.ts`):** Defines the structure and properties for storing SurrealDB connection details securely within n8n's credential management system.
5.  **Resource Handlers (e.g., `src/nodes/SurrealDb/resources/record/record.handler.ts`):**
    *   Each resource type (Record, Table, Field, Index, Relationship, Query, System) has its own handler.
    *   Handlers are responsible for managing operations related to that specific resource.
    *   They typically contain a `execute` method that switches based on the selected operation.
6.  **Operation Files (e.g., `src/nodes/SurrealDb/resources/record/operations/createRecord.operation.ts`):**
    *   Individual files define the logic for each specific operation (e.g., create record, delete table).
    *   These files contain the actual implementation of interacting with SurrealDB for that operation, including making HTTP requests and processing responses.
7.  **Generic Functions (`GenericFunctions.ts`, `utilities.ts`):** Contain helper functions used across different parts of the node, such as making HTTP requests to SurrealDB, handling responses, and processing parameters.
8.  **Type Definitions (`surrealDb.types.ts`, `operation.types.ts`):** TypeScript type definitions for SurrealDB-specific data structures and node operation parameters, ensuring type safety and clarity.

## 2. Key Technical Decisions

*   **HTTP/HTTPS Only:** Due to n8n's architectural constraints (specifically how it handles connections and executes node operations), this node exclusively uses HTTP/HTTPS for communication with SurrealDB. WebSocket (WS/WSS) connections are not supported. This implies stateless interactions with the database for each operation.
*   **TypeScript:** The node is developed in TypeScript, leveraging strong typing for better code quality, maintainability, and developer experience. This aligns with n8n's own development practices.
*   **Modular Design (Resource-Based):** Functionality is organized by "resources" (Table, Record, Field, etc.), each with its own set of "operations." This makes the codebase organized and easier to extend.
    *   Each resource has a dedicated directory (`src/nodes/SurrealDb/resources/<resourceName>/`).
    *   Within each resource directory, there's a handler (`<resourceName>.handler.ts`), properties definition (`<resourceName>.properties.ts`), and an `operations/` subdirectory.
*   **Declarative UI Definition (`SurrealDb.node.json`):** The node's UI in the n8n editor is defined declaratively, separating UI concerns from the core logic.
*   **Stateless Operations:** Each operation performed by the node is independent and establishes its own connection to SurrealDB. No persistent connection is maintained.
*   **Community Node Standards:** Adherence to n8n's guidelines for community node development, including file structure, naming conventions, and build processes (e.g., using `gulp` for building).

## 3. Design Patterns in Use

*   **Strategy Pattern (Implicit):** The main `SurrealDb.node.ts` delegates the execution to specific resource handlers based on the selected resource. Each resource handler then further delegates to specific operation files. This allows different operations (strategies) to be executed based on user selection.
*   **Handler Pattern:** Resource handlers (`*.handler.ts`) are responsible for managing requests for a specific resource type.
*   **Facade Pattern (Node as Facade):** The SurrealDB node itself acts as a simplified interface (facade) to the more complex operations of the SurrealDB API, tailored for the n8n environment.
*   **Modular Design:** The codebase is broken down into smaller, manageable modules (credentials, resources, operations, utilities), promoting separation of concerns and reusability.
*   **Declarative Configuration:** The `SurrealDb.node.json` file declaratively defines the node's interface and properties.

## 4. Component Relationships

*   `SurrealDb.node.ts` (Main Node Logic):
    *   Imports and uses `SurrealDb.node.json` for its definition.
    *   Uses `GenericFunctions.ts` for common tasks like making HTTP requests.
    *   Delegates execution to specific resource handlers found in `src/nodes/SurrealDb/resources/`.
*   `SurrealDb.node.json` (Node UI/Property Definition):
    *   Defines the `displayName`, `name`, `group`, `icon`, `description`, `defaults`, `credentials`, and `properties` (which include `resource` and `operation` selectors, and fields for each operation).
*   Resource Handlers (e.g., `record.handler.ts`):
    *   Are called by `SurrealDb.node.ts`.
    *   Import and execute specific operation functions from their respective `operations/` subdirectories.
*   Operation Files (e.g., `createRecord.operation.ts`):
    *   Contain the core logic for a single database operation.
    *   Utilize functions from `GenericFunctions.ts` or `utilities.ts` to interact with the SurrealDB HTTP API.
    *   Receive parameters from the n8n execution context (via the handler).
*   `SurrealDbApi.credentials.ts`:
    *   Defines the fields required for SurrealDB authentication, which are then managed by n8n's credential system.
    *   Used by `GenericFunctions.ts` or operation files when making authenticated requests.

## 5. Critical Implementation Paths

*   **Credential Handling and Authentication:** Securely obtaining and using credentials (connection string, username, password, namespace, database) to make authenticated HTTP requests to SurrealDB. This is central to all operations.
*   **HTTP Request Execution (`GenericFunctions.ts` - `surrealDbApiRequest` or similar):** The core function responsible for:
    *   Constructing the correct SurrealDB HTTP endpoint.
    *   Setting appropriate headers (including Authorization).
    *   Sending the request payload.
    *   Receiving and parsing the response.
    *   Basic error handling for HTTP errors.
*   **Dynamic Parameter Handling:** Operations need to correctly extract and use parameters provided by the user in the n8n UI (e.g., table name, record ID, data objects, SurrealQL queries, query parameters).
*   **Resource and Operation Dispatching:** The mechanism in `SurrealDb.node.ts` and then in each resource handler (`*.handler.ts`) that correctly routes the execution flow to the intended operation logic based on user selections.
*   **Data Transformation:**
    *   Input: Converting n8n data/user input into the format expected by SurrealDB's HTTP API.
    *   Output: Converting SurrealDB responses back into n8n's JSON-based item structure.
*   **Error Handling and Reporting:** Consistently handling errors from SurrealDB (e.g., query errors, connection issues) and presenting them clearly to the n8n user. Also, correctly handling SurrealDB's pattern of returning empty results for "not found" cases.
