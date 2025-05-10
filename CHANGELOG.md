# Changelog

All notable changes to the n8n-nodes-surrealdb package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.0]: https://github.com/nsxdavid/n8n-nodes-surrealdb/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/nsxdavid/n8n-nodes-surrealdb/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nsxdavid/n8n-nodes-surrealdb/releases/tag/v0.1.0
