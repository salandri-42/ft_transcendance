import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { Logger } from '@nestjs/common';

const logger = new Logger('WsAuthMiddleware');

/**
 * 
 * @description Middleware pour valider le JWT lors de la connexion WebSocket.
 *              Extrait le token de 'auth' ou des 'query' parameters.
 *              Injecte le userId (sub) dans socket.data.
 * 
 */
export const WsAuthMiddleware = () =>
{
	return (socket: Socket, next: (err?: Error) => void) =>
	{
		try
		{
			const auth = socket.handshake.auth;
			const token = auth?.token || socket.handshake.query?.token;

			if (!token)
			{
				logger.debug(`No token found for socket ${socket.id} - Guest mode`);
				return next();
			}

			const secret = process.env.JWT_SECRET || 'secret';
			const payload = jwt.verify(token as string, secret) as any;

			if (payload && payload.sub)
			{
				socket.data.userId = payload.sub;
				logger.log(`AUTHENTICATED user ${payload.sub} on socket ${socket.id}`);
			}
			else
			{
				logger.warn(`Token decoded but no 'sub' found for socket ${socket.id}`);
			}

			next();
		}
		catch (error)
		{
			logger.warn(`Auth failed for socket ${socket.id}: ${error.message}`);
			next();
		}
	};
};
