import { INestApplication } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * 
 * @description : definition du gateway pour le service identity
 * @param app : l'application nestjs
 * @methods : 
 * 	- onProxyReq : callback qui est appele avant que la requete soit envoyee au service identity
 * 	- onProxyRes : callback qui est appele apres que la reponse du service identity soit recue
 * 	- onError : callback qui est appele en cas d'erreur
 * 
 */

export function setupAuthProxy(app: INestApplication)
{
	const authProxy = createProxyMiddleware(['/auth', '/friends'], {
		target: process.env.IDENTITY_SERVICE_URL || 'https://identity:3001',
		changeOrigin: true,
		secure: false, // Permet les certificats auto-signés en interne
		onProxyReq: (proxyReq: any, req: any) =>
		{
			console.log(`[Gateway] Proxying to Identity: ${req.method} ${proxyReq.path}`);
			if (req.body && Object.keys(req.body).length > 0)
			{
				const bodyData = JSON.stringify(req.body);
				proxyReq.setHeader('Content-Type', 'application/json');
				proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
				proxyReq.write(bodyData);
			}
		},
		onProxyRes: (proxyRes: any) =>
		{
			console.log(`[Gateway] Identity Response: ${proxyRes.statusCode}`);
		},
		onError: (err: any, _req: any, res: any) =>
		{
			console.error('[Gateway] Proxy Error:', err.message);
			res.status(502).json({ message: 'Bad Gateway: Identity service unreachable' });
		},
	});

	app.use(authProxy);
}
