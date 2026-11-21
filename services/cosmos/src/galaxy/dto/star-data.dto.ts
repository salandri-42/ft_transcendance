import { IsNumber, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 
 * @description : DTO pour la creation d'une etoile. C'est ici qu'on definit les données attendues pour la creation d'une etoile.
 * 
 */

export class StarDataDto
{
	@IsOptional()
	@IsString()
	id?: string;

	@IsOptional()
	@IsString()
	textureUrl?: string;

	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	ownerId?: string;

	@IsOptional()
	@IsString()
	emotion?: string;

	@IsOptional()
	contextEmotion?: any;

	@IsNumber()
	orbitRadius: number;

	@IsArray()
	@ArrayMinSize(3)
	@ArrayMaxSize(3)
	@IsNumber({}, { each: true })
	rotation: [number, number, number];

	@IsArray()
	@ArrayMinSize(3)
	@ArrayMaxSize(3)
	@IsNumber({}, { each: true })
	tilt: [number, number, number];

	@IsNumber()
	angle: number;

	@IsOptional()
	@IsNumber()
	phase?: number;

	@IsOptional()
	@IsArray()
	@ArrayMinSize(2)
	@ArrayMaxSize(2)
	@IsNumber({}, { each: true })
	size?: [number, number];

	@IsOptional()
	@IsString()
	color?: string;

	@IsOptional()
	@IsNumber()
	opacity?: number;

	@IsOptional()
	@IsNumber()
	speed?: number;
	
	@IsOptional()
	@IsNumber()
	createdAt?: number;
}
