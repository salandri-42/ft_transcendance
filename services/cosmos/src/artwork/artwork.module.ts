import { Module } from '@nestjs/common';
import { ArtworkController } from './artwork.controller';
import { ArtworkService } from './artwork.service';

/**
 * 
 * @description : Module Artwork pour Cosmos.
 *                Encapsule le contrôleur et le service CRUD
 *                pour les réalisations (dessins) des utilisateurs.
 *                PrismaService est injecté via le PrismaModule global.
 * 
 */
@Module({
	controllers: [ArtworkController],
	providers: [ArtworkService],
	exports: [ArtworkService],
})
export class ArtworkModule {}
