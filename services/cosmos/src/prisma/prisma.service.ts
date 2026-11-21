import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * 
 * @description : Service Prisma pour le service Cosmos.
 *                Gère la connexion à la base de données cosmos_db.
 * 
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name);

	async onModuleInit()
	{
		await this.$connect();
		this.logger.log('Connected to Cosmos database (cosmos_db)');
	}

	async onModuleDestroy()
	{
		await this.$disconnect();
		this.logger.log('Disconnected from Cosmos database');
	}
}
