# SurrealDB Node Examples

This document provides practical examples of how to use the SurrealDB node in n8n workflows.

## Enhanced Query Builder Examples

### Example 1: Basic User Filtering

**Scenario**: Find all active users over 18 years old, sorted by name.

**Configuration**:
- **Resource**: Query
- **Operation**: Build Select Query
- **Table**: `user`
- **Fields**: `name, email, age, status`
- **Where Conditions**:
  - Field: `age`, Operator: `>`, Value: `18`, Logical: `AND`
  - Field: `status`, Operator: `=`, Value: `active`
- **Order By**:
  - Field: `name`, Direction: `ASC`
- **Limit**: `100`

**Generated Query**:
```sql
SELECT name, email, age, status FROM user WHERE age > 18 AND status = 'active' ORDER BY name ASC LIMIT 100
```

### Example 2: E-commerce Analytics

**Scenario**: Get sales data grouped by product category with total sales and count.

**Configuration**:
- **Resource**: Query
- **Operation**: Build Select Query
- **Table**: `order`
- **Fields**: `product.category, COUNT(*) as order_count, SUM(total) as total_sales`
- **Group By**: `product.category`
- **Where Conditions** (for filtering grouped results):
- Field: `COUNT(*)`, Operator: `>`, Value: `5`
- **Order By**:
  - Field: `total_sales`, Direction: `DESC`
- **Limit**: `50`

**Generated Query**:
```sql
SELECT product.category, COUNT(*) as order_count, SUM(total) as total_sales FROM order GROUP BY product.category WHERE COUNT(*) > 5 ORDER BY total_sales DESC LIMIT 50
```

### Example 3: Parameterized Date Range Query

**Scenario**: Find orders within a date range using parameters.

**Configuration**:
- **Resource**: Query
- **Operation**: Build Select Query
- **Table**: `order`
- **Fields**: `*`
- **Where Conditions**:
  - Field: `created_at`, Operator: `>=`, Value: `$start_date`, Logical: `AND`
  - Field: `created_at`, Operator: `<=`, Value: `$end_date`, Logical: `AND`
  - Field: `status`, Operator: `=`, Value: `completed`
- **Parameters**: `{"start_date": "2024-01-01", "end_date": "2024-12-31"}`
- **Order By**:
  - Field: `created_at`, Direction: `DESC`
- **Limit**: `1000`

**Generated Query**:
```sql
SELECT * FROM order WHERE created_at >= $start_date AND created_at <= $end_date AND status = 'completed' ORDER BY created_at DESC LIMIT 1000
```

### Example 4: Complex Filtering with Multiple Conditions

**Scenario**: Find high-value customers with specific criteria.

**Configuration**:
- **Resource**: Query
- **Operation**: Build Select Query
- **Table**: `customer`
- **Fields**: `name, email, total_spent, order_count, last_order_date`
- **Where Conditions**:
  - Field: `total_spent`, Operator: `>`, Value: `1000`, Logical: `AND`
  - Field: `order_count`, Operator: `>=`, Value: `5`, Logical: `AND`
  - Field: `status`, Operator: `=`, Value: `active`, Logical: `AND`
  - Field: `email`, Operator: `CONTAINS`, Value: `@gmail.com`
- **Order By**:
  - Field: `total_spent`, Direction: `DESC`
  - Field: `last_order_date`, Direction: `DESC`
- **Limit**: `100`

**Generated Query**:
```sql
SELECT name, email, total_spent, order_count, last_order_date FROM customer WHERE total_spent > 1000 AND order_count >= 5 AND status = 'active' AND email CONTAINS '@gmail.com' ORDER BY total_spent DESC, last_order_date DESC LIMIT 100
```

### Example 5: Split Results by Category

**Scenario**: Get products split by category for easier processing.

**Configuration**:
- **Resource**: Query
- **Operation**: Build Select Query
- **Table**: `product`
- **Fields**: `name, price, stock, category`
- **Where Conditions**:
  - Field: `stock`, Operator: `>`, Value: `0`, Logical: `AND`
  - Field: `active`, Operator: `=`, Value: `true`
- **Split On**: `category`
- **Order By**:
  - Field: `name`, Direction: `ASC`
- **Limit**: `500`

**Generated Query**:
```sql
SELECT name, price, stock, category FROM product WHERE stock > 0 AND active = true SPLIT ON category ORDER BY name ASC LIMIT 500
```

## Record Operations Examples

### Example 6: Create User Record

**Configuration**:
- **Resource**: Record
- **Operation**: Create Record
- **Table**: `user`
- **Record ID**: `john_doe` (optional)
- **Data**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "status": "active",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Example 7: Update User with Merge

**Configuration**:
- **Resource**: Record
- **Operation**: Merge Record
- **Table**: `user`
- **Record ID**: `john_doe`
- **Data**:
```json
{
  "last_login": "2024-01-20T15:45:00Z",
  "login_count": 25
}
```

## Table Operations Examples

### Example 8: Batch Create Records

**Configuration**:
- **Resource**: Table
- **Operation**: Create Many Records
- **Table**: `product`
- **Records Data**:
```json
[
  {
    "name": "Product A",
    "price": 29.99,
    "category": "electronics"
  },
  {
    "name": "Product B",
    "price": 49.99,
    "category": "clothing"
  },
  {
    "name": "Product C",
    "price": 19.99,
    "category": "books"
  }
]
```

### Example 9: Get All Records with Pagination

**Configuration**:
- **Resource**: Table
- **Operation**: Get All Records
- **Table**: `order`
- **Options**:
  - **Limit**: `50`
  - **Start**: `100`

## Relationship Operations Examples

### Example 10: Create User-Order Relationship

**Configuration**:
- **Resource**: Relationship
- **Operation**: Create Relationship
- **From Record ID**: `user:john_doe`
- **Relationship Type**: `placed`
- **To Record ID**: `order:12345`
- **Content**:
```json
{
  "order_date": "2024-01-15T10:30:00Z",
  "total": 99.99
}
```

### Example 11: Query User Orders

**Configuration**:
- **Resource**: Relationship
- **Operation**: Query Relationships
- **From Record ID**: `user:john_doe`
- **Relationship Type**: `placed`
- **Direction**: `out`

## Tips for Using the Enhanced Query Builder

1. **Start Simple**: Begin with basic queries and gradually add complexity
2. **Use Parameters**: Always use parameters for dynamic values to prevent injection attacks
3. **Test Incrementally**: Add one condition at a time to verify results
4. **Enable Query Return**: Use the "Return Generated Query" option to see the actual SurrealQL
5. **Validate Data Types**: Ensure your WHERE conditions use appropriate data types
6. **Use Logical Operators**: Combine conditions with AND/OR for complex filtering
7. **Leverage Split On**: Use SPLIT ON for organizing results by categories or groups

## Common Patterns

### Date Range Queries
Use parameters for date ranges to make queries reusable:
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

### Status Filtering
Filter by status fields to get relevant records:
- `status = 'active'`
- `status != 'deleted'`
- `status IN ['pending', 'processing']`

### Numeric Comparisons
Use appropriate operators for numeric fields:
- `price > 100` - High-value items
- `quantity >= 10` - Items with sufficient stock
- `rating >= 4.5` - Highly-rated items

### Text Search
Use CONTAINS for text search:
- `name CONTAINS 'search_term'`
- `description CONTAINS 'keyword'`

### Null Handling
Check for null or non-null values:
- `email IS NOT NULL` - Users with email addresses
- `phone IS NULL` - Users without phone numbers 