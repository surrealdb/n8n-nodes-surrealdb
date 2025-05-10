# Active Context: n8n-nodes-surrealdb (Initial Onboarding)

## 1. Current Work Focus

*   **Initial Project Onboarding:** The primary focus is to understand the `n8n-nodes-surrealdb` project by establishing its Memory Bank.
*   **Memory Bank Creation:** Systematically creating the core Memory Bank files (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`) as per `.clinerules/memorybank.md`.
*   **Information Gathering:** Reviewing existing project files (`README.md`, `package.json`, file structure) to populate the Memory Bank.

## 2. Recent Changes (by Cline)

*   **Created `docs/memory-bank/` directory.**
*   **Created `docs/memory-bank/projectbrief.md`:** Based on `README.md` and project structure.
*   **Created `docs/memory-bank/productContext.md`:** Based on `README.md`, `projectbrief.md`, and project structure.
*   **Created `docs/memory-bank/systemPatterns.md`:** Based on `README.md`, `projectbrief.md`, `productContext.md`, and project file structure.
*   **Created `docs/memory-bank/techContext.md`:** Based on `README.md`, `package.json`, and other Memory Bank files.
*   **Currently creating this `docs/memory-bank/activeContext.md` file.**

## 3. Next Steps (for Cline)

1.  **Create `docs/memory-bank/progress.md`:** This will be the final core Memory Bank file to create in this initial onboarding phase. It will summarize the project's current capabilities as understood from the `README.md` and file structure (e.g., what operations are implemented).
2.  **Confirm Onboarding Completion:** Once all core Memory Bank files are created, report that the initial "coming up to speed" task is complete.
3.  **Await Further Instructions:** Wait for the user to provide a specific development task or objective for the `n8n-nodes-surrealdb` project.

## 4. Active Decisions and Considerations

*   **Memory Bank Location:** Decided to place all memory bank files within `docs/memory-bank/` for organization, as suggested by the `.clinerules/memorybank.md`.
*   **Information Source Priority:** Prioritizing `README.md` and `package.json` for initial factual information, then inferring architectural and contextual details from the file structure for the Memory Bank.
*   **Interpretation of `surrealdb` Dependency:** Noted in `techContext.md` the potential discrepancy between the listed `surrealdb` npm package (which often favors WebSocket) and the project's stated HTTP-only constraint. This is a point for future verification if a task involves modifying connection logic. For now, documentation reflects what's explicitly stated or listed.

## 5. Important Patterns and Preferences (Observed in Project)

*   **Modular Structure:** The project follows a clear modular structure, with code organized by `credentials` and `nodes/SurrealDb/resources/<resourceName>/operations`. This pattern should be maintained for any new features or changes.
*   **TypeScript and Strict Typing:** The use of TypeScript suggests a preference for type safety and clear interface definitions.
*   **Declarative UI:** Node properties and UI are defined in a `.json` file (`SurrealDb.node.json`), separating UI from logic.
*   **Resource/Operation Paradigm:** Functionality is consistently organized around "Resources" (e.g., Table, Record) and "Operations" (e.g., Create, Get, Delete). This is a core organizational principle of the node.
*   **Adherence to n8n Standards:** The project structure and scripts (`package.json`) indicate an effort to follow n8n community node development guidelines.

## 6. Learnings and Project Insights (Initial Pass)

*   The project provides a comprehensive set of operations for interacting with SurrealDB.
*   The HTTP-only constraint is a significant factor influencing the node's implementation and capabilities (e.g., no real-time features via WebSockets).
*   The codebase appears well-organized, which should facilitate future development and maintenance.
*   The dual functionality as both an action node and a tool node for AI workflows is a key feature.
*   Clear documentation (`README.md`) exists, providing a good starting point for users and developers.
