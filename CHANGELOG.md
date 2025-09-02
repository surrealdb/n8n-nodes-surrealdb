# Changelog

All notable changes to the n8n-nodes-surrealdb package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-09-02

### Added
- **Enhanced Query Builder**: Added a visual interface for building SELECT queries with support for WHERE, ORDER BY, GROUP BY, LIMIT, START, and SPLIT ON clauses. Features include:
  - Visual query builder for SELECT operations without writing raw SurrealQL
  - Support for multiple WHERE conditions with logical operators (AND/OR)
  - ORDER BY with multiple fields and sort directions
  - GROUP BY clauses for aggregate queries
  - Parameterized queries with dynamic value support
  - Option to return the generated SurrealQL query for debugging and learning
  - Comprehensive error handling and validation
- **Batch Query Operations**: Implemented batch processing capabilities for large-scale data operations:
  - Added `batchCreate`, `batchUpsert`, `batchUpdate`, and `batchDelete` operations for efficient handling of multiple records in a single request.
  - Supports parallel processing of batches to maximize throughput.
  - Includes progress tracking and detailed error reporting for each batch operation.
  - Designed for high-performance ingestion, migration, and bulk modification scenarios.
- **Connection Pooling Support**: Added comprehensive connection pooling for improved performance and resource management. Features include:
  - Configurable pool settings (max/min connections, timeouts, health checks)
  - Automatic connection health monitoring and cleanup
  - Connection reuse across node executions
  - Pool statistics and monitoring via "Get Pool Statistics" system operation
  - Automatic pool cleanup on node deactivation
- **Namespace and Database Configuration**: Enabled support for client-configured namespace and database in SurrealDB credentials and node operations. Users can now specify the namespace and database directly in the node parameters, allowing for dynamic selection at runtime.
- **Enhanced Error Handling & Recovery**: Implements intelligent error classification, retry logic, and connection recovery. Adds operation-specific configurations and enhanced error reporting with contextual information.

### Fixed
- **Connection Validation Queries**: Fixed connection validation queries to use proper SurrealQL syntax (`RETURN 1` instead of `SELECT 1`). This ensures compatibility with SurrealDB's query language standards and prevents validation failures in connection pooling and health checks.
- **WebSocket Connection Prevention**: Prevented connecting to SurrealDB instances using WebSocket protocols (`ws://` or `wss://`). The node now enforces HTTP/HTTPS-only connections and provides clear error messages if a WebSocket URL is supplied.
- **Centralized Debug Logging**: Added a centralized debug logging system, controlled by the `SURREAL_DEBUG` environment variable, to provide detailed logs for troubleshooting and development without polluting production output.
- **Query Operations Parameter Validation**: Fixed "Received tool input did not match expected schema" error when executing queries without parameters. The `parameters` field in Execute Query and Build Select Query operations is now correctly treated as optional and empty parameters no longer cause validation errors.
- **AI Tool Compatibility**: Fixed "Received tool input did not match expected schema" error when using query operations as AI tools by changing Parameters field type from `json` to `string` for better compatibility.
- **Batch Query Error Handling**: Fixed null/undefined property access error in executeQuery batch operations. Enhanced `checkQueryResult` function to iterate over all result elements instead of only checking the first element, properly handling batch operations. Updated filtering logic to use loose equality (`!= null`) instead of strict equality (`!== null`) to filter out both null AND undefined values. Resolves "Cannot read properties of null (reading $error)" error when processing SurrealDB batch query results containing null/undefined elements.

### Changed
- **Error Handling for `executeQuery`**: Improved error handling for the `executeQuery` operation, ensuring that errors are classified and reported more accurately, and that retry logic is applied consistently.
- **Development Workflow**: Fixed `tsc` command in development scripts and updated ESLint configuration to resolve errors and warnings.
- **Dependencies**: Updated third-party dependencies for improved stability and compatibility.

## [0.4.1] - 2025-05-31

### Fixed
- **Execute Query Operation**: Fixed parse error when using LIMIT option with queries ending in semicolons. LIMIT and START clauses are now properly inserted before the semicolon instead of after it.
- **Record ID Handling**: Fixed issue with SurrealDB angle-bracketed Record IDs (e.g., `table:⟨complex-id⟩`). The angle brackets `⟨⟩` around complex IDs are now properly stripped before creating RecordId objects, preventing double-bracketing and lookup failures.
- **Debug Logging**: Cleaned up all debug console.log statements and moved to conditional DEBUG flags for cleaner production output.

## [0.4.0] - 2025-05-31

### Added
- **Enhanced Update Record Operation**: Added support for SurrealDB's `UPDATE ... SET ...` syntax in the Update Record operation
  - New "Update Mode" field with options: "Replace Record" (default) and "Set Fields"
  - "Set Fields" mode allows granular field updates using SurrealDB SET operations
  - Support for multiple SET operations: `=` (set), `+=` (add/append), `-=` (subtract/remove), and `+ =` (string concatenation)
  - Proper handling of different data types: strings, numbers, arrays, objects, and booleans
  - String concatenation using `field = field + value` syntax for proper SurrealDB compatibility
  - Maintains backward compatibility with existing "Replace Record" behavior

### Fixed
- Corrected operator descriptions: `-=` operator works for both numeric subtraction and array element removal
- Improved value validation and error messages for SET operations
- Fixed dropdown field configuration for operation selection in SET mode

## [0.3.1] - 2025-05-31

### Changed
- Updated SurrealDB dependency from version 1.0.0 to 1.3.2 for improved stability and features.

### Fixed
- Fixed conflicting ID field handling in record operations. When a Record ID is specified in the Record ID field and the data also contains an `id` field, the `id` field is now automatically removed from the data to prevent SurrealDB errors.
- Removed duplicate error handling in upsert operation that was causing error messages to appear twice in the console.
- Applied the ID conflict fix to all record operations: createRecord, updateRecord, mergeRecord, and upsertRecord.

## [0.3.0] - 2025-05-09

### Fixed
- Corrected behavior for `Record: getRecord` operation. If a record is not found, it now outputs an item with `json: {}` instead of dropping the item, ensuring consistency with `alwaysOutputData` behavior.
- Corrected behavior for `Query: executeQuery` operation. If a query statement yields no rows, it now outputs an item with `json: {}` for that statement's result, instead of dropping the item.
- Corrected behavior for `Table: getAllRecords` operation. If a table is empty or the query returns no records, it now outputs an item with `json: {}` instead of dropping the item, ensuring consistency with other read operations on "no data".
- Ensured that various operations correctly handle "no data" scenarios by returning an appropriate empty/placeholder item structure, improving reliability when `alwaysOutputData` is true and `continueOnFail` is active.

## [0.2.0] - 2025-05-06

### Added
- Added ESM compatibility with custom loader for better compatibility with n8n
- Added `.npmrc` configuration for improved package management

### Changed
- Restructured project to follow standard Node.js conventions with all source code under `src/` directory
- Updated build process to work with new directory structure
- Updated package.json scripts to target the new src directory
- Set package type to "commonjs" for better module compatibility

### Fixed
- Fixed ESM compatibility issues with pkce-challenge dependency
- Fixed directory structure to follow best practices
- Fixed build process to properly generate dist files from src directory

## [0.1.0] - 2025-05-05

### Added
- Initial release of the n8n-nodes-surrealdb package
- SurrealDB node with both action and tool capabilities for n8n
- Record operations (create, get, update, upsert, delete)
- Table operations (list, create, delete, get all records, etc.)
- Field operations (list, create, delete)
- Index operations (create, list, delete, rebuild)
- Relationship operations (create, delete, query)
- Query operations (execute custom SurrealQL queries)
- System operations (health check, version)
- Comprehensive README and documentation

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

[0.4.1]: https://github.com/nsxdavid/n8n-nodes-surrealdb/compare/v0.4.0...v0.4.1
[0.3.1]: https://github.com/nsxdavid/n8n-nodes-surrealdb/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/nsxdavid/n8n-nodes-surrealdb/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/nsxdavid/n8n-nodes-surrealdb/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nsxdavid/n8n-nodes-surrealdb/releases/tag/v0.1.0
