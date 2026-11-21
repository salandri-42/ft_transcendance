import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

/**
 * 
 * @description : DTO pour la création d'un artwork.
 *                Le champ imageData (Buffer/binaire) est géré séparément
 *                via le file upload (Multer), pas dans ce DTO.
 * 
 */
export class CreateArtworkDto
{
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	type?: string;

	@IsNotEmpty()
	@IsString()
	ownerId: string;

	@IsNotEmpty()
	@IsString()
	starId: string;

	@IsOptional()
	data?: Record<string, any>;
}
