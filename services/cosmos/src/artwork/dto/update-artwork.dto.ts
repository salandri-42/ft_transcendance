import { IsString, IsOptional } from 'class-validator';

/**
 * 
 * @description : DTO pour la mise à jour d'un artwork.
 *                Tous les champs sont optionnels.
 * 
 */
export class UpdateArtworkDto
{
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	type?: string;

	@IsOptional()
	data?: Record<string, any>;
}
