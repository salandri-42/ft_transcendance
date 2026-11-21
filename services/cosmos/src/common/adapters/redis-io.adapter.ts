import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { WsAuthMiddleware } from '../middleware/ws-auth.middleware';

/**
 * 
 * @description : Adapter pour la gestion des sockets avec Redis
 * 
 */

export class RedisIoAdapter extends IoAdapter
{
	private adapterConstructor: ReturnType<typeof createAdapter>;

	/**
	 * 
	 * @description : Connecte le serveur aux clients Redis
	 * 
	 */
	async connectToRedis(): Promise<void>
	{
		const pubClient = new Redis(
		{
			host: process.env.REDIS_HOST || 'localhost',
			port: parseInt(process.env.REDIS_PORT, 10) || 6379,
		});
		const subClient = pubClient.duplicate();

		pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
		subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
		pubClient.on('connect', () => console.log('Redis Pub Client Connected'));
		subClient.on('connect', () => console.log('Redis Sub Client Connected'));

		this.adapterConstructor = createAdapter(pubClient, subClient);
	}

	/**
	 * 
	 * @description : Cree un serveur IO avec Redis
	 * 
	 */
	createIOServer(port: number, options?: ServerOptions): any
	{
		const server = super.createIOServer(port, options);
		server.adapter(this.adapterConstructor);
		server.use(WsAuthMiddleware());
		return server;
	}
}

