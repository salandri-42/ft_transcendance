import { IsString, IsNotEmpty, IsEthereumAddress, IsArray, IsOptional } from 'class-validator';

export class CreateNftDto {
  @IsString()
  @IsNotEmpty()
  title: string;  // ← NOUVEAU : Titre de l'œuvre (stocké on-chain)

  @IsString()
  @IsNotEmpty()
  name: string;  // Nom du NFT (métadonnées IPFS)

  @IsString()
  @IsNotEmpty()
  description: string;  // Description (métadonnées IPFS)

  @IsString()
  @IsNotEmpty()
  imageData: string;  // Image base64 ou URL

  @IsEthereumAddress()
  @IsNotEmpty()
  ownerAddress: string;  // Adresse du destinataire

  @IsArray()
  @IsOptional()
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}