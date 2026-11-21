import { INestApplication } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as https from 'https';

/**
 * 
 * @description : definition du gateway pour le service cosmos
 * @param app : l'application nestjs
 * @methods : 
 * 	- cosmosProxy : gateway pour le service cosmos
 * 	- server : le serveur qui va transformer les requetes http en websocket quand l'upgrade est declenche
 * 
 */
export function setupCosmosProxy(app: INestApplication)
{
	const cosmosProxy = createProxyMiddleware(
	{
		target: process.env.COSMOS_SERVICE_URL || 'https://cosmos:3002',
		changeOrigin: true,
		secure: false,
		ws: true,
		xfwd: true,
		logLevel: 'debug',
		agent: new https.Agent({ rejectUnauthorized: false }),
		onProxyReqWs: (proxyReq, req, socket, options, head) =>
		{
			console.log(`[Gateway] [WS] Upgrading connection to Cosmos for ${req.url}`);
		},
		onError: (err) =>
		{
			console.error('[Gateway] Cosmos Proxy Error:', err.message);
		},
	});

	app.use('/socket.io', cosmosProxy);
	
	const cosmosHttpProxy = createProxyMiddleware(
	{
		target: process.env.COSMOS_SERVICE_URL || 'https://cosmos:3002',
		changeOrigin: true,
		secure: false,
		pathRewrite: { '^/cosmos': '' },
		logLevel: 'debug',
		onError: (err) =>
		{
			console.error('[Gateway] Cosmos HTTP Proxy Error:', err.message);
		},
	});

	app.use('/cosmos', cosmosHttpProxy);

	const server = app.getHttpServer();
	server.on('upgrade', (req: any, socket: any, head: any) =>
	{
		if (req.url.startsWith('/socket.io'))
		{
			console.log(`[Gateway] [UPGRADE] Proxying WebSocket upgrade: ${req.url}`);
			(cosmosProxy as any).upgrade(req, socket, head);
		}
	});
}
