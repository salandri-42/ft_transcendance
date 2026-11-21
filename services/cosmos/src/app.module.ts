import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GalaxyModule } from './galaxy/galaxy.module';
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { ArtworkModule } from './artwork/artwork.module';

/**
 * 
 * @description : Module principal de l'application Cosmos.
 *                Inclut PrismaModule (global) pour la connexion à cosmos_db,
 *                ArtworkModule pour le CRUD des réalisations utilisateur,
 *                et GalaxyModule pour la gestion temps réel de la galaxie.
 * 
 */
@Module({
	imports:
	[
		PrismaModule,
		ArtworkModule,
		GalaxyModule,
		ConfigModule.forRoot({ isGlobal: true }),
		HttpModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule { }

