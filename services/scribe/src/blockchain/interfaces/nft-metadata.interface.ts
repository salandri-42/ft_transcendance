export interface NftAttribute {
  trait_type: string;
  value: string;
}

export interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NftAttribute[];
}

/**
 * Données métier stockées ON-CHAIN dans le smart contract
 */
export interface ArtworkOnChain {
  artist: string;      // Adresse de l'artiste
  timestamp: number;   // Timestamp de création (block.timestamp)
  title: string;       // Titre de l'œuvre
}

/**
 * Résultat complet d'un mint (on-chain + off-chain)
 */
export interface MintResult {
  success: boolean;
  tokenId?: number;
  transactionHash?: string;
  tokenURI?: string;
  owner?: string;
  onChainData?: ArtworkOnChain;  // Données stockées sur la blockchain
  error?: string;
}

/**
 * Détails complets d'un NFT
 */
export interface NftDetails {
  tokenId: number;
  owner: string;
  tokenURI: string;
  onChainData: ArtworkOnChain;  // Artiste, timestamp, titre
  metadata?: NftMetadata;         // Métadonnées IPFS (si récupérées)
}