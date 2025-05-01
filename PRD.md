
## 1. Resource Breakdown

The node's functionality shall be organized by the following resources:

### 1.1 Resource: Record

Interact with individual records.

- **Common Fields:**
    - `Table Name`: (string, required) The name of the target table.
- **Operations:**
    - **`Create`**: 
        - *Description*: Create a new record.
        - *Fields*: `Data (JSON)` (required, JSON object), `Record ID` (string, optional - ID part only). 
        - *Validation*: Validate that `Data (JSON)` is a valid JSON object. Throw an error if it's not.
        - *Action*: Calls `db.create(tableOrRecordId, data)`. If `Record ID` is provided, use `new RecordId(table, id)`; otherwise, use the table name string.
        - *Output Transformation*: Format output as `{ json: { result: <response_from_surrealdb> } }`.
    - **`Get`**:
        - *Description*: Retrieve a specific record by ID.
        - *Fields*: `Record ID` (string, required - ID part only).
        - *Validation*: Ensure `Record ID` is not empty. Throw an error if it is.
        - *Action*: Calls `db.select(new RecordId(table, id))`.
        - *Output Transformation*: Format output as `{ json: { result: <response_from_surrealdb> } }`.
    - **`Update`**:
        - *Description*: Replace the content of a specific record.
        - *Fields*: `Record ID` (string, required - ID part only), `Data (JSON)` (required, JSON object).
        - *Validation*: Validate that `Data (JSON)` is a valid JSON object and `Record ID` is not empty.
        - *Action*: Calls `db.update(new RecordId(table, id), data)`.
        - *Output Transformation*: Format output as `{ json: { result: <response_from_surrealdb> } }`.
    - **`Merge`**:
        - *Description*: Merge data into a specific record (updates existing fields, adds new ones).
        - *Fields*: `Record ID` (string, required - ID part only), `Data (JSON)` (required, JSON object).
        - *Validation*: Validate that `Data (JSON)` is a valid JSON object and `Record ID` is not empty.
        - *Action*: Calls `db.merge(new RecordId(table, id), data)`.
        - *Output Transformation*: Format output as `{ json: { result: <response_from_surrealdb> } }`.
    - **`Delete`**:
        - *Description*: Delete a specific record by ID.
        - *Fields*: `Record ID` (string, required - ID part only).
        - *Validation*: Ensure `Record ID` is not empty.
        - *Action*: Calls `db.delete(new RecordId(table, id))`.
        - *Output Transformation*: Format output as `{ json: { result: <response_from_surrealdb> } }`.
    - **`Upsert`**:
        - *Description*: Create a record if it doesn't exist, or update (replace) it if it does. *Note: Requires careful implementation, potentially using `db.update` or a specific query.*
        - *Fields*: `Record ID` (string, required - ID part only), `Data (JSON)` (required, JSON object).
        - *Validation*: Validate that `Data (JSON)` is a valid JSON object and `Record ID` is not empty.
        - *Action*: Calls `db.update(new RecordId(table, id), data)`. (Verify this aligns with desired upsert behavior; `db.merge` might be an alternative if merge-on-exist is preferred).
        - *Output Transformation*: Format output as `{ json: { result: <response_from_surrealdb> } }`.
- **Record ID Handling:** Input fields for `Record ID` should expect only the ID part (e.g., `user123`). Internal logic must prepend the table name and construct a `RecordId` object (e.g., `new RecordId('person', 'user123')`) before calling SDK functions. `RecordId` is a class provided by the SurrealDB JavaScript SDK.

### 1.2 Resource: Table

Interact with tables as a whole.

- **Common Fields:**
    - `Table Name`: (string, required) The name of the target table.
- **Operations:**
    - **`Get All Records`**:
        - *Description*: Retrieve all records from a table, with pagination.
        - *Fields*: 
            - In the "Additional Fields" section (hidden by default):
                - `Limit` (number, optional, default 100)
                - `Start` (number, optional, default 0)
        - *Validation*: Ensure `Limit` and `Start` are valid numbers if provided.
        - *Action*: Executes `db.query('SELECT * FROM type::table($table) LIMIT $limit START $start', { table, limit, start })`.
        - *Output Transformation*: For array results, return each record as a separate item in the n8n output array: `{ json: <record> }`.
    - **`Create Many`**:
        - *Description*: Create multiple records in a single operation.
        - *Fields*: `Records Data (JSON)` (required, must be a JSON *array* of record objects).
        - *Validation*: Validate that `Records Data` is a valid JSON array.
        - *Action*: Executes a parameterized `db.query('CREATE type::table($table) CONTENT $data', { table, data })` where `$data` is the parsed array.
        - *Output Transformation*: For array results, return each created record as a separate item in the n8n output array: `{ json: <record> }`.
    - **`Get Many`**:
        - *Description*: Retrieve multiple specific records by their IDs.
        - *Fields*: `Record IDs` (string, required, comma-separated list of ID parts).
        - *Validation*: Ensure `Record IDs` is not empty and contains valid, comma-separated IDs.
        - *Action*: Parses the comma-separated string into an array of ID parts. Constructs an array of `RecordId` objects. Calls `db.select(arrayOfRecordIds)`.
        - *Output Transformation*: For array results, return each record as a separate item in the n8n output array: `{ json: <record> }`.

### 1.3 Resource: Query

Execute arbitrary SurrealQL queries.

- **Operations:**
    - **`Execute Query`**:
        - *Description*: Execute a raw SurrealQL query.
        - *Fields*: `Query` (string, required, SurrealQL syntax), `Parameters (JSON)` (optional, JSON object for query parameters like `{"key": "value"}`).
        - *Validation*: Ensure `Query` is not empty. If `Parameters` is provided, validate it's a valid JSON object.
        - *Action*: Calls `db.query(queryString, parameters)`. Handle cases with and without parameters.
        - *Pagination*: In the "Additional Fields" > "Options" section (hidden by default), provide `Limit` and `Start` number fields. If these are provided *and* the user's `Query` string does not already contain `LIMIT` or `START` clauses, append them carefully to the query string before execution.
        - *Output Transformation*: For query results, return data based on the result type:
            - For single record/value: `{ json: { result: <response_data> } }`
            - For array results: Return each item as a separate n8n item: `{ json: <record> }`

### 1.4 Resource: System

Perform database system-level checks.

- **Operations:**
    - **`Health Check`**:
        - *Description*: Check if the database instance is responsive.
        - *Fields*: None.
        - *Action*: Use n8n's `httpRequest` helper to perform a GET request to the database's `/health` endpoint (using the base URL from credentials). Return JSON indicating `status: 'healthy'` or `status: 'unhealthy'` with details/error messages. **Do not throw an error on failure.**
        - *Output Transformation*: Format output as `{ json: { status: 'healthy|unhealthy', details: <optional_details> } }`.
    - **`Version`**:
        - *Description*: Get the version of the SurrealDB instance.
        - *Fields*: None.
        - *Action*: First, attempt `db.query('INFO FOR SERVER')`. If successful, parse the version from the result. If it fails, use n8n's `httpRequest` helper to perform a GET request to the database's `/version` endpoint as a fallback. Return JSON with the version string or `'unknown'` and any error details. **Do not throw an error on failure.**
        - *Output Transformation*: Format output as `{ json: { version: <version_string>, details: <optional_details> } }`.

## 2. SDK Interaction Specifics

- **Connection Management:** Following n8n best practices, establish the connection in the execute method before performing any operations, not at the operation level. The connection should be established as follows:
  ```typescript
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Initialize the connection at the start of execution
    const db = new Surreal();
    
    try {
      // Connect to the database
      await db.connect(url);
      
      // Authenticate
      await db.signin(authParams);
      
      // Set namespace and database if needed
      await db.use({ ns: namespace, db: databaseName });
      
      // Execute the actual operation
      // ...
      
      return [this.helpers.returnJsonArray(result)];
    } catch (error) {
      throw new NodeOperationError(this.getNode(), error, { itemIndex });
    } finally {
      // Always close the connection when done
      await db.close();
    }
  }
  ```

- **Namespace/Database Context:** Before executing operations that require it (most operations except potentially Root auth sign-in and system checks), ensure the correct context is set using `db.use({ ns: namespace, db: databaseName })`. Allow overrides via `Additional Fields` if necessary.

- **Record IDs:** As specified in Resource sections, always use `new RecordId(table, id)` when passing specific record identifiers to SDK methods like `select`, `update`, `merge`, `delete`. The `RecordId` class is provided by the SurrealDB JavaScript SDK.

- **Parameterization:** Use parameterized queries (`db.query(query, params)`) whenever user input is part of a query (e.g., Query resource, Create Many, Get All Records) to prevent SurrealQL injection vulnerabilities.

- **Response Handling:** Parse responses from the SDK. The `db.query` method often returns an array of result sets; ensure the actual data rows are extracted correctly. Format the final output consistently for n8n according to the output transformation guidelines in each operation.

- **Output Transformation Best Practices:**
  - For single item results, return `{ json: { result: <response_data> } }`
  - For array results (like table queries), return each item in the array as a separate n8n item: `[{ json: item1 }, { json: item2 }, ...]`
  - Use n8n's `this.helpers.returnJsonArray()` to properly format arrays of items
  - Preserve the original structure of SurrealDB responses where possible
  - For timestamp data generated by the node (not from SurrealDB), use ISO 8601 format (e.g., `new Date().toISOString()`)

## 3. Input Validation

- **JSON Validation:**
  - For all fields accepting JSON input (`Data (JSON)`, `Records Data (JSON)`, `Parameters (JSON)`), validate that the input is valid JSON:
  ```typescript
  try {
    const parsedData = JSON.parse(dataInput);
    // Continue with operation using parsedData
  } catch (error) {
    throw new NodeOperationError(this.getNode(), 'Invalid JSON provided', { itemIndex });
  }
  ```

- **Required Field Validation:**
  - For all required fields, validate they are not empty before proceeding:
  ```typescript
  if (!recordId) {
    throw new NodeOperationError(this.getNode(), 'Record ID is required', { itemIndex });
  }
  ```

- **Type Validation:**
  - Validate that numeric fields contain valid numbers:
  ```typescript
  if (limit !== undefined && (isNaN(Number(limit)) || Number(limit) < 0)) {
    throw new NodeOperationError(this.getNode(), 'Limit must be a positive number', { itemIndex });
  }
  ```
  
- **Array Validation:**
  - For fields expecting arrays (like `Records Data` in "Create Many"), validate the input is an array:
  ```typescript
  if (!Array.isArray(parsedData)) {
    throw new NodeOperationError(this.getNode(), 'Records Data must be a JSON array', { itemIndex });
  }
  ```

- **Error Response Format:**
  - All error responses should follow n8n community node best practices. Specifically, use `NodeOperationError` with descriptive messages, providing the node reference and item index where applicable: `throw new NodeOperationError(this.getNode(), 'Specific error message', { itemIndex });`. 
  - Error messages should be user-friendly and actionable, indicating what went wrong and how to fix it.
  - Example error messages:
    - "Invalid JSON format. Please check your input and ensure it's valid JSON."
    - "Connection failed: Unable to authenticate with the provided credentials."
    - "Query execution error: Syntax error in SurrealQL query."
