import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * 
 * @description : Controller pour les routes
 * 
 */
@Controller()
export class AppController
{
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string
	{
		return this.appService.getHello();
	}

	@Get('health')
	getHealth(): string
	{
		return 'Cosmos OK';
	}
}
