import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { RingData, StarData, OrbitalData } from './interfaces/socket.types';


/**
 * 
 * @description : Assure la logique metier du service : 
 *              - generation de l'etat initial de la galaxie
 *              - ajout de nouvelles etoiles
 *              - recuperation de l'etat actuel de la galaxie
 * 
 */

@Injectable()
export class GalaxyService implements OnModuleInit
{
	/* **************** PROPERTIES **************** */
	private readonly logger = new Logger(GalaxyService.name);
	private readonly planes = [
		{ radii: [1100, 1700, 2500, 3700, 5500, 7100, 8500, 9700, 10700], rotation: [0, 0, 0] as [number, number, number] },
		{ radii: [1200, 1800, 2600, 3800, 5600, 7200, 8600, 9800, 10800], rotation: [Math.PI / 9, 0, 0] as [number, number, number] },
		{ radii: [1300, 1900, 2700, 3900, 5700, 7300, 8700, 9900, 10900], rotation: [-Math.PI / 8, 0, 0] as [number, number, number] },
		{ radii: [1400, 2000, 2800, 4000, 5800, 7400, 8800, 10000, 11000], rotation: [0, 0, Math.PI / 9] as [number, number, number] },
		{ radii: [1550, 2150, 2950, 4150, 5950, 7550, 8950, 10150, 11150], rotation: [0, 0, -Math.PI / 9] as [number, number, number] },
		{ radii: [1650, 2250, 3050, 4250, 6050, 7650, 9050, 10250, 11250], rotation: [0, 0, -Math.PI / 8] as [number, number, number] },
	];

	private galaxyState: OrbitalData | null = null;
	private serverStartTime: number;

	/* **************** CONSTRUCTOR **************** */
	constructor(private readonly prisma: PrismaService)
	{
		this.serverStartTime = Date.now();
		this.galaxyState = this.generateInitialState();
	}

	async onModuleInit()
	{
		if (!this.galaxyState)
			return;

		this.logger.log('Synchronizing generated stars with DB (for Artwork relations)...');
		
		const starsToUpsert = this.galaxyState.stars.map(s =>
		({
			id: s.id,
			x: s.orbitRadius,
			y: 0,
			z: 0,
				ownerId: s.ownerId ?? null,
		}));

		try
		{
			await this.prisma.star.createMany({
				data: starsToUpsert,
				skipDuplicates: true,
			});
			this.logger.log(`Ensured ${starsToUpsert.length} stars exist in database.`);

			const starsWithArtwork = await this.prisma.star.findMany(
			{
				where: { artworks: { some: {} } },
				include: { artworks: true }
			});

			for (const dbStar of starsWithArtwork)
			{
					const matchingRing = this.findMatchingRing(dbStar.x);

				this.galaxyState.stars.push({
					id: dbStar.id,
					orbitRadius: dbStar.x,
					rotation: matchingRing?.rotation || [0, 0, 0],
					tilt: matchingRing?.tilt || [-Math.PI / 2, 0, 0],
					angle: Math.random() * Math.PI * 2,
					phase: 0,
					size: [80, 80],
					color: '#ffffff',
					opacity: 1,
					speed: 5,
					createdAt: dbStar.createdAt.getTime(),
					idealCameraDistance: 250,
					name: dbStar.name || undefined,
					ownerId: dbStar.artworks[0]?.ownerId || dbStar.ownerId || null,
					emotion: dbStar.emotion || undefined,
					contextEmotion: dbStar.contextEmotion || undefined,
					textureUrl: dbStar.artworks[0] ? `/api/cosmos/artworks/${dbStar.artworks[0].id}/image` : undefined
				});
				this.logger.log(`Restored artwork star ${dbStar.id}`);
			}
		}
		catch (e)
		{
			this.logger.error('Failed to sync stars with database', e);
		}
	}

	/* **************** PRIVATE METHODS **************** */

	/**
	 * @description Trouve l'anneau le plus proche d'un rayon d'orbite donné
	 *              pour hériter de sa rotation et de son tilt.
	 */
	private findMatchingRing(orbitRadius: number): RingData | null
	{
		if (!this.galaxyState)
			return null;

		let closest: RingData | null = null;
		let minDist = Infinity;

		for (const ring of this.galaxyState.rings)
		{
			const dist = Math.abs(ring.radius - orbitRadius);
			if (dist < minDist)
			{
				minDist = dist;
				closest = ring;
			}
		}
		return closest;
	}

	private pickColor(): string
	{
		// const roll = Math.random();
		// if (roll > 0.9)
		// 	return '#ff8833';
		// if (roll > 0.7)
		// 	return '#3388ff';
		return '#ffffff';
	}

	private generateInitialState(): OrbitalData
	{
		const rings: RingData[] = [];
		const stars: StarData[] = [];

		for (const plane of this.planes)
		{
			for (const radius of plane.radii)
			{
				const tilt: [number, number, number] = [
					-Math.PI / 2 + (Math.random() - 0.5) * 0.2,
					(Math.random() - 0.5) * 0.2,
					0,
				];

				rings.push(
				{
					radius,
					rotation: plane.rotation,
					tilt,
					thickness: 2,
					color: Math.random() > 0.5 ? 'cyan' : 'white',
					opacity: 0.3,
				});
			}
		}
		return { serverStartTime: this.serverStartTime, rings, stars };
	}

	/* **************** PUBLIC METHODS **************** */
	getGalaxyState(): OrbitalData
	{
		return this.galaxyState;
	}

	async addStar(star: StarData): Promise<void>
	{
		if (this.galaxyState)
		{
			this.galaxyState.stars.push(star);
			
			try
			{
				await this.prisma.star.create({
					data: {
						id: star.id,
						name: star.name,
						ownerId: star.ownerId ?? null,
						emotion: star.emotion,
						contextEmotion: star.contextEmotion,
						x: star.orbitRadius,
						y: 0,
						z: 0,
					}
				});
				this.logger.log(`Persisted new star ${star.id} to database.`);
			}
			catch (e) 
			{
				this.logger.error(`Failed to persist new star ${star.id}`, e);
			}
		}
	}
	async updateStarEmotion(starId: string, emotion: string, contextEmotion: any): Promise<void>
	{
		this.logger.log(`Updating star ${starId} with late emotion/context...`);
		
		const star = this.galaxyState?.stars.find(s => s.id === starId);

		if (star)
		{
			star.emotion = emotion;
			star.contextEmotion = contextEmotion;
		}
		try
		{
			await this.prisma.star.update({
				where: { id: starId },
				data: { emotion, contextEmotion }
			});
			this.logger.log(`Successfully persisted late emotion for star ${starId}`);
		}
		catch (e)
		{
			this.logger.error(`Error updating star ${starId} in DB`, e);
		}
	}
}
