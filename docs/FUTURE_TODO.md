# Future TODOs for n8n-nodes-surrealdb

## **Current status**

### **Recently Implemented**

1. **Relationship resources** ✅
   - createRelationship (using RELATE statement)
   - deleteRelationship (with flexible parameter options)
   - queryRelationships (with option to split results)

2. **Connection pooling** ✅
   - Connection pool with health monitoring and automatic reconnection
   - Connection reuse across operations within the same execution context
   - Graceful connection cleanup and resource management
   - Performance statistics tracking and monitoring
   - Enhanced error handling with retry logic and exponential backoff
   - Connection validation with configurable timeouts
   - Comprehensive pool statistics and health monitoring
   - Global connection pool management with proper cleanup
   - Configuration validation and error handling
   - Enhanced debugging and logging capabilities

3. **Enhanced error handling** ✅
   - Comprehensive error classification
   - Retry logic with exponential backoff
   - Enhanced error reporting with context

## **Next Steps**

1. **Implement Enhanced Authentication** - Add JWT token and OAuth2 support
2. **Add Batch Operations** - Implement native batch create/update/delete operations
3. **Begin Schema Discovery** - Implement automatic field discovery and validation
4. **Plan Live Query Implementation** - Research WebSocket integration for real-time features

This file contains a list of potential resources and operations that could be added to the n8n-nodes-surrealdb package to provide more comprehensive coverage of SurrealDB's features.

## Missing Resources/Operations

1. **Authentication Resource**
   - signUp (for record/scope users)
   - signIn (for record/scope users)
   - signOut/invalidate
   - authenticate (with token)
   - info (get current user info)

2. **User Resource**
   - createUser (system/database users)
   - getUser
   - updateUser
   - deleteUser
   - listUsers

3. **Access/Scope Resource**
   - defineAccess (create authentication methods)
   - getAccess
   - updateAccess
   - deleteAccess
   - listAccess

4. **Event Resource**
   - defineEvent (create event triggers)
   - getEvent
   - updateEvent
   - deleteEvent
   - listEvents

5. **Function Resource**
   - defineFunction (create custom functions)
   - getFunction
   - updateFunction
   - deleteFunction
   - listFunctions

6. **Schema Definition Resource**
   - defineTable (for defining table schemas)
   - defineField (for defining field schemas)
   - defineIndex (for defining index schemas)
   - defineAnalyzer (for defining analyzers)

7. **Transaction Resource**
   - beginTransaction
   - commitTransaction
   - cancelTransaction

8. **Live Query Resource**
   - liveListen (for real-time updates)
   - liveQuery

9. **Patch Operations**
   - patchRecord (JSON Patch operations)
   - patchAllRecords

10. **Insert Operations**
    - insertRecord (insert without replacing)
    - insertMany

11. **Variable Operations**
    - setVariable (let method in SDK)
    - getVariable
    - removeVariable

12. **Permission Resource**
    - definePermission
    - getPermission
    - updatePermission
    - deletePermission
    - listPermissions

13. **Analyzer Resource** (for full-text search)
    - defineAnalyzer
    - getAnalyzer
    - updateAnalyzer
    - deleteAnalyzer
    - listAnalyzers

14. **Namespace/Database Operations**
    - createNamespace
    - useNamespace
    - deleteNamespace
    - listNamespaces
    - createDatabase
    - useDatabase
    - deleteDatabase
    - listDatabases

15. **Graph Operations**
    - traverseGraph (for graph queries)
    - shortestPath
    - findConnections

## Implementation Priority

When implementing these features, consider prioritizing:

1. Authentication operations (essential for secure applications)
2. Transaction support (important for data integrity)
3. Live queries (important for real-time applications)
4. User and permission management
5. Advanced graph operations (shortest path, traversal algorithms)

## Implementation Notes

- Some operations may require additional research to determine the best way to implement them in the n8n context
- Consider the user experience and how these operations would be used in typical n8n workflows
- Ensure consistent error handling and result formatting across all new operations
- Provide options for result formatting (e.g., single item with array vs. multiple individual items)
- Validate input parameters carefully, especially for operations that could affect multiple records

## Lessons Learned from Relationship Implementation

- SurrealDB's graph capabilities are powerful but require careful query construction
- Record IDs must be in the format "table:id" for relationship operations
- Flexible parameter options (making parameters optional) can provide more utility but require careful validation
- Offering both result formats (single item with array vs. multiple items) provides better flexibility for workflows
- Testing with actual SurrealDB instances is essential as the query syntax can be specific
