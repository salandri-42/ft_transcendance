import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupAuthProxy } from './proxy/auth.proxy';
import { setupCosmosProxy } from './proxy/cosmos.proxy';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 
 * @description : Fonction de bootstrap de l'application. Son role est de 
 * 	- creer et configurer l'application nestjs
 *  - lancer l'application
 * 
 * @methods : 
 * 	- setupAuthProxy : methode qui permet de configurer le proxy pour le service identity
 * 	- setupCosmosProxy : methode qui permet de configurer le proxy pour le service cosmos
 * 
 */
async function bootstrap()
{
	const httpsOptions = {
		key: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.key')),
		cert: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.crt')),
	};

	console.log("!!! GATEWAY BOOTSTRAP: HTTPS ENABLED !!!");
	const app = await NestFactory.create(AppModule, { httpsOptions });

	setupAuthProxy(app);
	setupCosmosProxy(app);

	// Necessary for Cloudflare and Nginx reverse proxy info
	(app.getHttpAdapter().getInstance() as any).set('trust proxy', true);

	app.enableCors({
		origin: ['https://orel.page', 'https://www.orel.page', 'https://localhost:8443', 'https://localhost'],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
	});

	const port = process.env.PORT || 3000;
	await app.listen(port, '0.0.0.0');

	console.log(`[Gateway] Service running on HTTPS: ${await app.getUrl()}`);
}

bootstrap();
