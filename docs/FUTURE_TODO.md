# Future TODOs for n8n-nodes-surrealdb

## **Current status**

### **Recently Implemented**

1. **Enhanced Query Builder** ✅
   - Visual interface for building SELECT queries without writing raw SurrealQL
   - Support for WHERE, ORDER BY, GROUP BY, LIMIT, START, and SPLIT ON clauses
   - Multiple WHERE conditions with logical operators (AND/OR)
   - Parameterized queries with dynamic value support
   - Option to return generated SurrealQL query for debugging and learning
   - Comprehensive error handling and validation
   - Support for 14 different operators including CONTAINS, IS NULL, etc.

2. **Relationship resources** ✅
   - createRelationship (using RELATE statement)
   - deleteRelationship (with flexible parameter options)
   - queryRelationships (with option to split results)

3. **Connection pooling** ✅
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

4. **Enhanced error handling** ✅
   - Comprehensive error classification
   - Retry logic with exponential backoff
   - Enhanced error reporting with context

## **Next Steps**

1. **Implement Enhanced Authentication** - Add JWT token and OAuth2 support
2. **Begin Schema Discovery** - Implement automatic field discovery and validation
3. **Plan Live Query Implementation** - Research WebSocket integration for real-time features

## **Comprehensive Improvement Roadmap**

### **Phase 1: Core Enhancements (Immediate - 1-2 months)**

#### **1. Enhanced Authentication & Security** 🔐
**Priority: High**

**Current State**: Basic Root/Namespace/Database authentication
**Proposed Enhancements**:
- JWT token support with automatic refresh
- OAuth2 integration for cloud instances
- Token-based authentication for API access
- Session management and token caching
- Credential rotation and secure storage

**Implementation**:
```typescript
interface ISurrealApiCredentials {
  // ... existing fields
  authenticationMethod: "basic" | "jwt" | "oauth2" | "token";
  jwtToken?: string;
  oauth2Config?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope?: string;
  };
  tokenExpiry?: number;
  autoRefresh?: boolean;
}
```

#### **2. Transaction Support** 💾
**Priority: High**

**Current State**: No transaction support
**Proposed Enhancements**:
- Begin/commit/rollback transaction operations
- Execute operations within transaction context
- Atomic batch operations
- Rollback capabilities for error recovery

**Implementation**:
```typescript
export const transactionOperations = {
  beginTransaction: "Begin Transaction",
  commitTransaction: "Commit Transaction", 
  rollbackTransaction: "Rollback Transaction",
  executeInTransaction: "Execute In Transaction"
};
```

### **Phase 2: Advanced Features (Short-term - 2-3 months)**

#### **3. Schema Discovery & Validation** 🔍
**Priority: Medium**

**Current State**: Manual field definition
**Proposed Enhancements**:
- Automatic field type detection
- Schema validation before operations
- Index optimization suggestions
- Relationship auto-detection
- Schema caching and versioning

**Implementation**:
```typescript
interface ISchemaDiscovery {
  autoDiscoverFields: boolean;
  validateDataTypes: boolean;
  suggestIndexes: boolean;
  detectRelationships: boolean;
  schemaCaching: boolean;
}
```



#### **4. Live Query Support** ⚡
**Priority: Medium**

**Current State**: No real-time capabilities
**Proposed Enhancements**:
- Polling-based change detection
- Event-driven workflows
- Webhook integration patterns
- Real-time data synchronization

**Implementation**:
```typescript
interface ILiveQuery {
  pollingInterval: number;
  changeDetection: "timestamp" | "checksum" | "version";
  maxRetries: number;
  eventFiltering: boolean;
}
```

### **Phase 3: Performance & Monitoring (Medium-term - 3-6 months)**

#### **5. Performance Optimizations** ⚡
**Priority: Medium**

**Current State**: Basic connection pooling
**Proposed Enhancements**:
- Query result caching
- Response compression
- Parallel query execution
- Streaming large result sets
- Query performance analysis

**Implementation**:
```typescript
interface IPerformanceConfig {
  queryCaching: boolean;
  resultCompression: boolean;
  connectionReuse: boolean;
  parallelQueries: boolean;
  resultStreaming: boolean;
}
```

#### **6. Advanced Error Recovery** 🔄
**Priority: Low-Medium**

**Current State**: Basic retry logic
**Proposed Enhancements**:
- Circuit breaker pattern
- Automatic fallback operations
- Intelligent retry strategies
- Error pattern recognition
- Recovery strategy selection

**Implementation**:
```typescript
interface IErrorRecovery {
  automaticRetry: boolean;
  circuitBreaker: boolean;
  fallbackOperations: boolean;
  errorClassification: boolean;
  recoveryStrategies: string[];
}
```

#### **7. Monitoring & Analytics** 📊
**Priority: Low**

**Current State**: Basic pool statistics
**Proposed Enhancements**:
- Query performance tracking
- Error rate monitoring
- Usage analytics
- Health check dashboard
- Performance recommendations

**Implementation**:
```typescript
interface IMonitoring {
  performanceMetrics: boolean;
  queryAnalytics: boolean;
  errorTracking: boolean;
  usageStatistics: boolean;
  healthDashboard: boolean;
}
```

### **Phase 4: Developer Experience (Long-term - 6+ months)**

#### **8. Developer Experience** 👨‍💻
**Priority: Low-Medium**

**Current State**: Basic node functionality
**Proposed Enhancements**:
- Interactive query debugger
- Schema exploration tools
- Data preview capabilities
- Export/import functionality
- Documentation integration

**Implementation**:
```typescript
interface IDeveloperExperience {
  queryDebugger: boolean;
  schemaExplorer: boolean;
  dataPreview: boolean;
  exportCapabilities: boolean;
  documentationIntegration: boolean;
}
```

## **Technical Architecture Improvements**

### **Code Quality Enhancements**
- **Type Safety**: Enhance TypeScript interfaces for better type safety
- **Testing**: Add comprehensive unit and integration tests
- **Documentation**: Improve inline documentation and examples
- **Modular Design**: Continue the current modular structure pattern

### **Security Enhancements**
- **Credential Management**: Secure storage and rotation of credentials
- **Query Sanitization**: Enhanced input validation and sanitization
- **Audit Logging**: Track operations for security and compliance
- **Access Control**: Fine-grained permission management

### **Performance Considerations**
- **Connection Pooling**: Advanced features beyond current implementation
- **Query Optimization**: Add query analysis and optimization suggestions
- **Caching Strategy**: Implement intelligent caching for frequently accessed data
- **Resource Management**: Better memory and connection lifecycle management

## **Implementation Strategy**

### **Development Approach**
1. **Incremental Implementation**: Build features incrementally to maintain stability
2. **Backward Compatibility**: Ensure all new features don't break existing workflows
3. **User Feedback**: Gather feedback from the community for feature prioritization
4. **Testing Strategy**: Comprehensive testing at each phase

### **Resource Allocation**
- **Phase 1**: Core team focus (2-3 developers)
- **Phase 2**: Core team + community contributions
- **Phase 3**: Community-driven with core team oversight
- **Phase 4**: Community-driven features

### **Success Metrics**
- **Adoption Rate**: Increased usage of advanced features
- **Performance**: Improved query execution times
- **Reliability**: Reduced error rates and improved recovery
- **User Satisfaction**: Community feedback and feature requests

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
