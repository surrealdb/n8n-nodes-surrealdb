# n8n-nodes-surrealdb

This is an n8n community node for SurrealDB. It provides nodes to interact with a SurrealDB database.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### SurrealDB

* **Create** - Create a record in a table
* **Delete** - Delete records from a table
* **Query** - Execute a SurrealQL query
* **Select** - Select records from a table
* **Update** - Update records in a table

## Credentials

To use the SurrealDB node, you need to create credentials with the following properties:

* **Configuration Type** - Choose between connection string or individual values
* **Connection String** - If using connection string, provide the full connection string (e.g., wss://cloud.surrealdb.com)
* **Host** - If using values, provide the host (e.g., localhost)
* **Port** - If using values, provide the port (e.g., 8000)
* **Protocol** - If using values, choose the protocol (HTTP, HTTPS, WebSocket, WebSocket Secure)
* **Namespace** - SurrealDB namespace
* **Database** - SurrealDB database name
* **Username** - SurrealDB username
* **Password** - SurrealDB password

## Compatibility

This node has been tested with SurrealDB v1.x.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [SurrealDB documentation](https://surrealdb.com/docs)
