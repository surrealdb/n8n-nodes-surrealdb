# Product Context: n8n-nodes-surrealdb

## 1. Why This Project Exists

This project, `n8n-nodes-surrealdb`, exists to bridge the gap between the n8n workflow automation platform and the SurrealDB multi-model database. As n8n empowers users to connect various services and automate processes, there's a growing need to integrate modern databases like SurrealDB. SurrealDB offers unique features (e.g., multi-model capabilities, SurrealQL, real-time features) that users might want to leverage within their automated workflows.

Without this community node, n8n users would have to rely on generic HTTP request nodes and manually craft every interaction with SurrealDB, which is cumbersome, error-prone, and requires deep knowledge of SurrealDB's API. This node simplifies these interactions, making SurrealDB a first-class citizen within the n8n ecosystem for self-hosted users.

## 2. Problems It Solves

This node solves several key problems for n8n users who want to use SurrealDB:

*   **Complexity of Integration:** Manually integrating with SurrealDB via HTTP requests in n8n is complex. This node abstracts that complexity.
*   **Lack of Native Support:** n8n does not have built-in, native support for SurrealDB. This community node fills that void.
*   **Repetitive Configuration:** Users would otherwise need to repeatedly configure connection details and query structures. This node standardizes operations and credential management.
*   **Accessibility for Less Technical Users:** Simplifies SurrealDB interactions, making it accessible to users who might not be database experts but need to store or retrieve data.
*   **Efficiency in Workflow Development:** Speeds up the development of workflows involving SurrealDB by providing pre-built operations.
*   **AI Integration:** Enables AI agents within n8n (using the tool node functionality) to interact with SurrealDB, opening up possibilities for AI-driven data management and retrieval.
*   **Standardization:** Provides a standardized way to interact with SurrealDB, ensuring consistency across different workflows and users.

## 3. How It Should Work

The `n8n-nodes-surrealdb` node should function as a seamless and intuitive bridge to SurrealDB within the n8n environment.

### Core Functionality:
1.  **Installation:** Users install it as a community node in their self-hosted n8n instance.
2.  **Credential Setup:** Users create a new credential type in n8n, providing their SurrealDB connection string (HTTP/HTTPS only), authentication details (username, password), and authentication scope (Root, Namespace, Database), including namespace and database names as required by the scope.
3.  **Node Usage (Action Node):**
    *   Users add the "SurrealDB" node to their workflow.
    *   They select the configured SurrealDB credentials.
    *   They choose a `Resource` (e.g., Record, Table, Query).
    *   They choose an `Operation` for that resource (e.g., Create Record, Get All Records, Execute Query).
    *   They fill in the required parameters for the operation (e.g., table name, record ID, data, SurrealQL query).
    *   They can override namespace and database settings from credentials in an "Options" section if needed and permitted by the authentication scope.
    *   Upon execution, the node connects to SurrealDB via HTTP/HTTPS, performs the operation, and returns the result (or an empty result for "not found" scenarios) as n8n data.
4.  **Node Usage (Tool Node):**
    *   When `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE` is true, AI agents in n8n can invoke the SurrealDB node's functionalities programmatically based on natural language or structured requests.
    *   The AI agent would specify the resource, operation, and necessary parameters.
5.  **Data Flow:** The node should accept n8n data as input for operations like creating or updating records and should output data retrieved from SurrealDB in a format easily usable by subsequent n8n nodes.
6.  **Error Handling:**
    *   Connection errors or invalid operation errors should be reported clearly.
    *   It should respect SurrealDB's behavior of returning empty results for queries that find no data, and integrate with n8n's "Always Output Data" option.

### Connection Handling:
*   All connections are stateless (HTTP/HTTPS). Each operation initiates a new connection and closes it upon completion.
*   WebSocket connections (ws:// or wss://) are explicitly not supported.

## 4. User Experience (UX) Goals

*   **Ease of Use:** Configuration should be straightforward and intuitive for users familiar with n8n.
*   **Clarity:** Node parameters, descriptions, and help texts should be clear and unambiguous.
*   **Discoverability:** Operations should be logically grouped by resource, making it easy for users to find the functionality they need.
*   **Flexibility:** While providing simple interfaces for common tasks, it should also offer advanced options like raw query execution for power users.
*   **Reliability:** The node should perform operations consistently and reliably.
*   **Feedback:** Provide meaningful feedback to the user, whether an operation is successful or encounters an error.
*   **Consistency:** Maintain consistency with the look, feel, and operational patterns of other n8n nodes.
*   **Comprehensive Coverage:** Aim to cover most common SurrealDB interactions, reducing the need for users to fall back to generic HTTP nodes for database tasks.
