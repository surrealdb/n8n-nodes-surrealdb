# Technical Context: n8n-nodes-surrealdb

## 1. Technologies Used

*   **Primary Language:** TypeScript (`~4.9.5` as per `package.json`)
    *   Compiles to JavaScript (`commonjs` module system, output in `dist/` directory).
*   **Node.js:** The runtime environment for n8n and this community node.
*   **n8n Core Libraries:**
    *   `n8n-core`: Provides core functionalities for n8n node development.
    *   `n8n-workflow`: Used for workflow-related functionalities.
*   **SurrealDB Client Library:**
    *   `surrealdb` (npm package, version `^1.0.0`): This is listed as a dependency. However, the `README.md` and `systemPatterns.md` emphasize that the node uses HTTP/HTTPS directly due to n8n limitations, not WebSockets (which the `surrealdb.js` library primarily uses for many operations or its full feature set). The actual HTTP requests might be constructed manually or via a generic HTTP client within n8n's framework, rather than heavily relying on this specific library for transport if it defaults to WS. This needs clarification or confirmation by inspecting `GenericFunctions.ts`. For now, it's listed as a dependency.
*   **Build Tools:**
    *   `gulp` (`^4.0.2`): Used for build tasks, specifically `gulp build:icons` as seen in `package.json` scripts.
    *   `tsc` (TypeScript Compiler): Used for compiling TypeScript to JavaScript.
*   **Linting & Formatting:**
    *   `eslint` (`^9.26.0`): For code linting.
    *   `eslint-plugin-n8n-nodes-base` (`^1.13.1`): n8n-specific ESLint rules.
    *   `@typescript-eslint/parser` (`^5.59.2`): ESLint parser for TypeScript.
    *   `prettier` (`^2.8.8`): For code formatting.
*   **Development Dependencies (from `devDependencies`):**
    *   `@types/*`: Type definitions for various libraries (express, request-promise-native).
    *   `request-promise-native`: Likely used by n8n-core or for making HTTP requests if not using n8n's built-in request mechanisms.

## 2. Development Setup

Based on `package.json` scripts and typical n8n node development:

1.  **Clone Repository:** `git clone https://github.com/nsxdavid/n8n-nodes-surrealdb.git`
2.  **Install Dependencies:** `npm install`
3.  **Build Node:** `npm run build` (compiles TypeScript and builds icons).
4.  **Development Mode (Watch for changes):** `npm run dev` (runs `tsc --watch`).
5.  **Linking for Local n8n Testing:**
    *   In the node's directory: `npm link`
    *   In your local n8n installation directory: `npm link n8n-nodes-surrealdb`
6.  **Running n8n Locally (with the node):** The `package.json` includes a script `npm run n8n` which is `node --experimental-loader=./esm-loader.js ./node_modules/n8n/bin/n8n`. This suggests a specific way to run n8n, possibly for development or testing purposes, using a local n8n version from `node_modules`.
7.  **Environment Variables:**
    *   For tool node functionality: `N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true` must be set in the n8n environment.

## 3. Technical Constraints

*   **HTTP/HTTPS Only for SurrealDB:** This is a major constraint imposed by n8n's architecture. The node cannot use SurrealDB's WebSocket (WS/WSS) protocol. This means:
    *   Connections are stateless.
    *   Real-time features of SurrealDB that rely on WebSockets are not directly usable through this node.
    *   The official `surrealdb.js` library might have limited utility if its core functionalities are tied to WebSockets, or specific HTTP-compatible methods must be used/re-implemented.
*   **Self-Hosted n8n Only:** As a community node, it does not work with n8n Cloud.
*   **n8n API Version:** The node targets `n8nNodesApiVersion: 1`. Future n8n updates might require adaptations.
*   **SurrealDB Version Compatibility:** Tested with SurrealDB v1.x/v2.x. Future SurrealDB versions might introduce breaking changes to the HTTP API.
*   **Stateless Operations:** Each node execution is a new, independent interaction with SurrealDB. There's no persistent session maintained by the node across multiple operations or workflow executions.

## 4. Dependencies

### Production Dependencies (`dependencies`):
*   `surrealdb: ^1.0.0`: The official JavaScript library for SurrealDB. Its exact role in HTTP communication needs to be verified against the actual HTTP request implementation in the node's code, given the HTTP-only constraint.

### Development Dependencies (`devDependencies`):
*   `@types/*`: Type definitions.
*   `@typescript-eslint/parser`: ESLint parser for TypeScript.
*   `eslint`: Linter.
*   `eslint-plugin-n8n-nodes-base`: n8n-specific linting rules.
*   `gulp`: Task runner (for icons).
*   `n8n-core`: Core n8n types and utilities for node development.
*   `n8n-workflow`: n8n workflow types and utilities.
*   `prettier`: Code formatter.
*   `typescript`: TypeScript compiler.

### Overrides:
*   `pkce-challenge: 3.0.0`: This suggests a specific version of this transitive dependency is enforced, likely to resolve compatibility issues or security vulnerabilities.

## 5. Tool Usage Patterns

*   **npm:** Used as the package manager for installing dependencies and running scripts (build, dev, lint, format).
*   **Git:** For version control and collaboration (repository hosted on GitHub).
*   **TypeScript Compiler (`tsc`):** Directly invoked for compiling `.ts` files to `.js`.
*   **Gulp:** Used for specific build tasks like icon processing (`build:icons`).
*   **ESLint:** For static code analysis and enforcing coding standards.
*   **Prettier:** For automated code formatting to maintain consistent style.
*   **IDE (e.g., VS Code):** Implied by the presence of `.code-workspace` file, likely used for development with TypeScript support, linting, and formatting integrations.
*   **n8n CLI:** The `n8n` script in `package.json` suggests usage of the n8n CLI for development or testing.
*   **`esm-loader.js`:** This custom loader is used when running the `n8n` script, indicating a need to handle ES Modules in a CommonJS-based n8n environment or vice-versa during development.
