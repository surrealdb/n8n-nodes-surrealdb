import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class SurrealDbApi implements ICredentialType {
	name = 'surrealDbApi';
	displayName = 'SurrealDB API';
	documentationUrl = 'https://surrealdb.com/docs';
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.configurationType === "connectionString" ? $credentials.connectionString.split("://")[0].replace("ws", "http") + "://" + $credentials.connectionString.split("://")[1].split("/")[0] : $credentials.protocol === "ws" ? "http://" + $credentials.host + ":" + $credentials.port : $credentials.protocol === "wss" ? "https://" + $credentials.host + ":" + $credentials.port : $credentials.protocol + "://" + $credentials.host + ":" + $credentials.port}}',
			url: '/health',
			method: 'GET',
		},
	};
	properties: INodeProperties[] = [
		{
			displayName: 'Configuration Type',
			name: 'configurationType',
			type: 'options',
			options: [
				{
					name: 'Connection String',
					value: 'connectionString',
				},
				{
					name: 'Values',
					value: 'values',
				},
			],
			default: 'values',
		},
		{
			displayName: 'Connection String',
			name: 'connectionString',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					configurationType: [
						'connectionString',
					],
				},
			},
			placeholder: 'wss://cloud.surrealdb.com',
			description: 'SurrealDB connection string',
		},
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'localhost',
			displayOptions: {
				show: {
					configurationType: [
						'values',
					],
				},
			},
			placeholder: 'localhost',
			description: 'SurrealDB host',
		},
		{
			displayName: 'Port',
			name: 'port',
			type: 'number',
			default: 8000,
			displayOptions: {
				show: {
					configurationType: [
						'values',
					],
				},
			},
			description: 'SurrealDB port',
		},
		{
			displayName: 'Protocol',
			name: 'protocol',
			type: 'options',
			options: [
				{
					name: 'HTTP',
					value: 'http',
				},
				{
					name: 'HTTPS',
					value: 'https',
				},
				{
					name: 'WebSocket',
					value: 'ws',
				},
				{
					name: 'WebSocket Secure',
					value: 'wss',
				},
			],
			default: 'ws',
			displayOptions: {
				show: {
					configurationType: [
						'values',
					],
				},
			},
			description: 'Protocol to use',
		},
		{
			displayName: 'Namespace',
			name: 'namespace',
			type: 'string',
			default: '',
			required: true,
			description: 'SurrealDB namespace',
		},
		{
			displayName: 'Database',
			name: 'database',
			type: 'string',
			default: '',
			required: true,
			description: 'SurrealDB database name',
		},
		{
			displayName: 'Username',
			name: 'user',
			type: 'string',
			default: 'root',
			description: 'SurrealDB username',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: 'root',
			description: 'SurrealDB password',
		},
	];
}
