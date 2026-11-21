import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GalaxyGateway } from './galaxy.gateway';
import { GalaxyService } from './galaxy.service';
import { GalaxyController } from './galaxy.controller';
import { PythiaClientService } from '../common/pythia/pythia-client.service';
import { StarContextService } from './starContext/star-context.service';
import { ArtworkModule } from '../artwork/artwork.module';

@Module({
	imports: [
		ArtworkModule,
		ClientsModule.register([
			{
				name: 'PYTHIA_SERVICE',
				transport: Transport.REDIS,
				options: {
					host: process.env.REDIS_HOST || 'redis',
					port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
				},
			},
			{
				name: 'SCRIBE_SERVICE',
				transport: Transport.REDIS,
				options: {
					host: process.env.REDIS_HOST || 'redis',
					port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
				},
			},
		]),
	],
	controllers: [GalaxyController],
	providers: [GalaxyGateway, GalaxyService, PythiaClientService, StarContextService],
})
export class GalaxyModule { }
