# Project Brief: n8n-nodes-surrealdb

## Overview
This project is a custom n8n node for connecting to SurrealDB, a cloud-native NewSQL database. The node provides both action and tool functionality to interact with SurrealDB instances, allowing n8n workflows to perform database operations.

## Core Requirements

1. **Functional SurrealDB Integration**: Provide a reliable connection to SurrealDB instances with proper authentication and error handling.

2. **Resource-Based Organization**: Organize node functionality by resources:
   - Record: Operations on individual records
   - Table: Operations on entire tables
   - Query: Execute arbitrary SurrealQL queries
   - System: Database system-level checks

3. **Comprehensive Operations**: Support all essential database operations:
   - Create, read, update, delete (CRUD) operations for records
   - Bulk operations for tables
   - Query execution with parameter support
   - System health and version checks

4. **User-Friendly Interface**: Provide a clear, intuitive UI with appropriate field validation and helpful error messages.

5. **Consistent Output Formatting**: Ensure consistent output formatting for all operations, following n8n best practices.

6. **Robust Error Handling**: Implement comprehensive error handling with descriptive error messages.

## Project Scope

The node should provide a complete interface to SurrealDB functionality, allowing n8n users to:

1. Connect to SurrealDB instances (local, remote, or cloud)
2. Perform all standard database operations
3. Execute custom SurrealQL queries
4. Check database health and version

The implementation should follow n8n community node best practices and leverage the SurrealDB JavaScript SDK for all database operations.

## Success Criteria

1. All operations specified in the PRD are implemented and working correctly
2. The node UI is intuitive and user-friendly
3. Error handling is robust and provides helpful error messages
4. Output formatting is consistent and follows n8n best practices
5. The node passes all tests and works reliably in production environments
