import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 
 * @description : Middleware pour logger toutes les requêtes entrantes sur la Gateway.
 * 
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware
{
	private readonly logger = new Logger('Gateway');

	use(req: Request, _res: Response, next: NextFunction)
	{
		this.logger.log(`Incoming: ${req.method} ${req.url}`);
		next();
	}
}