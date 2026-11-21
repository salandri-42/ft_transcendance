import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtworkDto, UpdateArtworkDto } from './dto';
import { Artwork } from '@prisma/client';

/**
 * 
 * @description : Service CRUD pour les artworks.
 *                Gère la persistance des dessins utilisateur en base cosmos_db.
 *                L'image binaire (JPG) est stockée dans le champ `imageData` (Bytes).
 * 
 */
@Injectable()
export class ArtworkService
{
	private readonly logger = new Logger(ArtworkService.name);

	constructor(private readonly prisma: PrismaService) {}


	/* **************** CREATE **************** */
	async create(dto: CreateArtworkDto, imageBuffer: Buffer, mimeType: string): Promise<Artwork>
	{
		const artwork = await this.prisma.artwork.create({
			data: {
				title:     dto.title,
				type:      dto.type || 'drawing',
				mimeType:  mimeType || 'image/jpeg',
				imageData: imageBuffer,
				imageSize: imageBuffer.length,
				data:      dto.data || {},
				ownerId:   dto.ownerId,
				starId:    dto.starId,
			},
		});

		this.logger.log(`Artwork created: ${artwork.id} (${artwork.imageSize} bytes) for star ${artwork.starId}`);
		return artwork;
	}


	/* **************** READ **************** */
	async findAll(): Promise<Omit<Artwork, 'imageData'>[]>
	{
		return this.prisma.artwork.findMany({
			select: {
				id:        true,
				title:     true,
				type:      true,
				mimeType:  true,
				imageSize: true,
				data:      true,
				ownerId:   true,
				starId:    true,
				isMinted:  true,
				tokenId:   true,
				txHash:    true,
				tokenURI:  true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	async findById(id: string): Promise<Artwork>
	{
		const artwork = await this.prisma.artwork.findUnique({ where: { id } });
		if (!artwork)
			throw new NotFoundException(`Artwork ${id} not found`);
		return artwork;
	}

	async findByOwner(ownerId: string): Promise<Omit<Artwork, 'imageData'>[]>
	{
		return this.prisma.artwork.findMany({
			where: { ownerId },
			select: {
				id:        true,
				title:     true,
				type:      true,
				mimeType:  true,
				imageSize: true,
				data:      true,
				ownerId:   true,
				starId:    true,
				isMinted:  true,
				tokenId:   true,
				txHash:    true,
				tokenURI:  true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	async findByStar(starId: string): Promise<Omit<Artwork, 'imageData'>[]>
	{
		return this.prisma.artwork.findMany({
			where: { starId },
			select: {
				id:        true,
				title:     true,
				type:      true,
				mimeType:  true,
				imageSize: true,
				data:      true,
				ownerId:   true,
				starId:    true,
				isMinted:  true,
				tokenId:   true,
				txHash:    true,
				tokenURI:  true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	/**
	 * Retourne uniquement les données binaires de l'image
	 * pour servir l'image au frontend (Content-Type: image/jpeg)
	 */
	async getImageData(id: string): Promise<{ imageData: Buffer; mimeType: string }>
	{
		const artwork = await this.prisma.artwork.findUnique({
			where: { id },
			select: { imageData: true, mimeType: true },
		});
		if (!artwork)
			throw new NotFoundException(`Artwork ${id} not found`);
		return { imageData: Buffer.from(artwork.imageData), mimeType: artwork.mimeType };
	}


	/* **************** UPDATE **************** */
	async update(id: string, dto: UpdateArtworkDto, imageBuffer?: Buffer, mimeType?: string): Promise<Artwork>
	{
		await this.findById(id); // throws if not found

		const updateData: any = { ...dto };
		if (imageBuffer)
		{
			updateData.imageData = imageBuffer;
			updateData.imageSize = imageBuffer.length;
		}
		if (mimeType)
			updateData.mimeType = mimeType;

		const artwork = await this.prisma.artwork.update({
			where: { id },
			data: updateData,
		});

		this.logger.log(`Artwork updated: ${artwork.id}`);
		return artwork;
	}


	/* **************** DELETE **************** */
	async remove(id: string): Promise<Artwork>
	{
		await this.findById(id); // throws if not found

		const artwork = await this.prisma.artwork.delete({ where: { id } });
		this.logger.log(`Artwork deleted: ${artwork.id}`);
		return artwork;
	}


	/* **************** BLOCKCHAIN **************** */
	/**
	 * @description : Met à jour l'artwork avec les données de minting retournées par Scribe.
	 */
	async updateMintResult(
		artworkId: string,
		data: { tokenId: number; txHash: string; tokenURI: string },
	): Promise<Artwork>
	{
		const artwork = await this.prisma.artwork.update({
			where: { id: artworkId },
			data: {
				isMinted: true,
				tokenId:  data.tokenId,
				txHash:   data.txHash,
				tokenURI: data.tokenURI,
			},
		});

		this.logger.log(`Artwork ${artworkId} minted as NFT #${data.tokenId} (tx: ${data.txHash})`);
		return artwork;
	}
}
