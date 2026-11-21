import { CreateNftDto } from '../dto/create-nft.dto';

/**
 * Job de minting NFT
 */
export interface MintNftJob {
  requestId: string;
  dto: CreateNftDto;
  metadata?: {
    artworkId?: string;
    userId?: string;
    emotion?: string;
    priority?: number;  // 1-10 (10 = urgent)
  };
}

/**
 * Résultat du job
 */
export interface MintNftJobResult {
  requestId: string;
  success: boolean;
  tokenId?: number;
  transactionHash?: string;
  tokenURI?: string;
  owner?: string;
  onChainData?: {
    artist: string;
    timestamp: number;
    title: string;
  };
  error?: string;
  attempts?: number;  // Nombre de tentatives
}