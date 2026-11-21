import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Param,
	Body,
	Res,
	UploadedFile,
	UseInterceptors,
	Logger,
	ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ArtworkService } from './artwork.service';
import { CreateArtworkDto, UpdateArtworkDto } from './dto';

type UploadedImageFile = {
	buffer: any;
	mimetype: string;
};

@Controller('artworks')
export class ArtworkController
{
	private readonly logger = new Logger(ArtworkController.name);

	constructor(private readonly artworkService: ArtworkService) {}


	/* **************** CREATE **************** */
	@Post()
	@UseInterceptors(FileInterceptor('image'))
	async create(
		@Body() dto: CreateArtworkDto,
		@UploadedFile() file: UploadedImageFile,
	)
	{
		this.logger.log(`Creating artwork for owner=${dto.ownerId}, star=${dto.starId}`);
		return this.artworkService.create(dto, file.buffer, file.mimetype);
	}


	/* **************** READ **************** */
	@Get()
	async findAll()
	{
		return this.artworkService.findAll();
	}

	@Get(':id')
	async findById(@Param('id', ParseUUIDPipe) id: string)
	{
		return this.artworkService.findById(id);
	}

	/**
	 * Sert l'image binaire directement avec le bon Content-Type.
	 * Utilisation frontend : <img src="/artworks/{id}/image" />
	 */
	@Get(':id/image')
	async getImage(
		@Param('id', ParseUUIDPipe) id: string,
		@Res() res: Response,
	)
	{
		const { imageData, mimeType } = await this.artworkService.getImageData(id);
		res.set('Content-Type', mimeType);
		res.set('Content-Length', imageData.length.toString());
		res.send(imageData);
	}

	@Get('owner/:ownerId')
	async findByOwner(@Param('ownerId') ownerId: string)
	{
		return this.artworkService.findByOwner(ownerId);
	}

	@Get('star/:starId')
	async findByStar(@Param('starId') starId: string)
	{
		return this.artworkService.findByStar(starId);
	}


	/* **************** UPDATE **************** */
	@Put(':id')
	@UseInterceptors(FileInterceptor('image'))
	async update(
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateArtworkDto,
		@UploadedFile() file?: UploadedImageFile,
	)
	{
		this.logger.log(`Updating artwork ${id}`);
		return this.artworkService.update(
			id,
			dto,
			file?.buffer,
			file?.mimetype,
		);
	}


	/* **************** DELETE **************** */
	@Delete(':id')
	async remove(@Param('id', ParseUUIDPipe) id: string)
	{
		this.logger.log(`Deleting artwork ${id}`);
		return this.artworkService.remove(id);
	}
}
