import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * 
 * @description : Module global Prisma pour Cosmos.
 *                Exporté globalement pour que tous les modules
 *                de Cosmos puissent injecter PrismaService.
 * 
 */
@Global()
@Module({
	providers: [PrismaService],
	exports: [PrismaService],
})
export class PrismaModule {}
