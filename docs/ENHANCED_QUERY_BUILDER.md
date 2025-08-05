# Enhanced Query Builder for SurrealDB

The Enhanced Query Builder provides a visual interface for building SELECT queries in SurrealDB without needing to write raw SurrealQL. This feature is available in the Query resource under the "Build Select Query" operation.

## Features

The Enhanced Query Builder supports the following SurrealQL SELECT features:

- **Basic SELECT**: Choose table and fields to select
- **WHERE Conditions**: Filter results with multiple conditions
- **ORDER BY**: Sort results by multiple fields
- **GROUP BY**: Group results by fields

- **LIMIT/START**: Pagination support
- **SPLIT ON**: Split results on specific fields
- **Parameters**: Use parameterized queries for dynamic values

## Usage

### Basic Query

1. Select **Query** as the resource
2. Choose **Build Select Query** as the operation
3. Enter the table name (e.g., `person`)
4. Specify fields to select (e.g., `name, age, email` or `*` for all fields)
5. Set limit and start values for pagination

### Adding WHERE Conditions

1. Click **Add Where Condition**
2. Enter the field name (e.g., `age`)
3. Choose an operator (e.g., `>`)
4. Enter the value (e.g., `18`)
5. Choose logical operator (AND/OR) for combining with next condition

**Supported Operators:**
- `=` - Equals
- `!=` - Not Equals
- `>` - Greater Than
- `>=` - Greater Than or Equal
- `<` - Less Than
- `<=` - Less Than or Equal
- `CONTAINS` - Contains
- `!CONTAINS` - Not Contains
- `INSIDE` - Inside
- `!INSIDE` - Not Inside
- `OUTSIDE` - Outside
- `INTERSECTS` - Intersects
- `IS NULL` - Is Null
- `IS NOT NULL` - Is Not Null

### Adding ORDER BY

1. Click **Add Order By**
2. Enter the field name to sort by (e.g., `name`)
3. Choose sort direction (ASC/DESC)

### Using GROUP BY

1. Enter comma-separated fields in **Group By** (e.g., `department, status`)
2. Use aggregate functions in your SELECT fields (e.g., `COUNT(*)`, `SUM(amount)`)
3. Filter grouped results using WHERE conditions with aggregate functions

### Using Parameters

1. In WHERE conditions, use `$param_name` as values
2. Provide the actual values in the **Parameters (JSON)** field
3. Example: Use `$min_age` in a condition and provide `{"min_age": 25}` in parameters

### Split On

Enter comma-separated fields to split results on (e.g., `department, status`). This is useful for organizing results by specific fields.

## Examples

### Example 1: Basic Filtering

**Table:** `person`
**Fields:** `name, age, email`
**Where Conditions:**
- Field: `age`, Operator: `>`, Value: `18`, Logical: `AND`
- Field: `status`, Operator: `=`, Value: `active`

**Generated Query:**
```sql
SELECT name, age, email FROM person WHERE age > 18 AND status = 'active'
```

### Example 2: Complex Query with Parameters

**Table:** `orders`
**Fields:** `*`
**Where Conditions:**
- Field: `total`, Operator: `>`, Value: `$min_total`, Logical: `AND`
- Field: `created_at`, Operator: `>=`, Value: `$start_date`
**Parameters:** `{"min_total": 100, "start_date": "2024-01-01"}`
**Order By:**
- Field: `total`, Direction: `DESC`
**Limit:** `50`

**Generated Query:**
```sql
SELECT * FROM orders WHERE total > $min_total AND created_at >= $start_date ORDER BY total DESC LIMIT 50
```

### Example 3: Grouped Query

**Table:** `sales`
**Fields:** `department, COUNT(*) as count, SUM(amount) as total`
**Group By:** `department`
**Having Conditions:**
- Field: `COUNT(*)`, Operator: `>`, Value: `10`
**Order By:**
- Field: `total`, Direction: `DESC`

**Generated Query:**
```sql
SELECT department, COUNT(*) as count, SUM(amount) as total FROM sales GROUP BY department HAVING COUNT(*) > 10 ORDER BY total DESC
```

## Options

### Return Generated Query

Enable the **Return Generated Query** option to include the generated SurrealQL query in the output. This is useful for:
- Debugging query construction
- Learning SurrealQL syntax
- Verifying the generated query before execution

### Namespace and Database Override

You can override the namespace and database settings from your credentials for individual operations.

## Tips

1. **Use Parameters**: Always use parameters for dynamic values to prevent SQL injection and improve performance
2. **Test Simple Queries First**: Start with basic queries and gradually add complexity
3. **Use the Generated Query**: Enable "Return Generated Query" to see the actual SurrealQL being executed
4. **Field Names**: Use exact field names as they appear in your SurrealDB schema
5. **Data Types**: The builder automatically detects and formats numbers, booleans, and strings appropriately

## Limitations

- The builder is designed for SELECT queries only
- Complex subqueries and joins are not supported
- Some advanced SurrealQL features may require using the raw "Execute Query" operation
- Field names with special characters should be properly escaped in SurrealQL

## Error Handling

The Enhanced Query Builder includes comprehensive error handling:
- Validates required fields
- Provides clear error messages for invalid conditions
- Supports the same retry and recovery mechanisms as other operations
- Continues execution on failure when "Continue on Fail" is enabled 