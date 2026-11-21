/**
 * Base pour tous les messages événementiels
 */
export interface BaseEventMessage {
  requestId: string;  // UUID pour tracer la requête
  timestamp?: number;
}

/**
 * Événement: blockchain.mint
 * Demande de minting d'un NFT
 */
export interface MintNftEvent extends BaseEventMessage {
  title: string;
  name: string;
  description: string;
  imageData: string;
  ownerAddress: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  // Métadonnées optionnelles pour traçabilité
  metadata?: {
    artworkId?: string;
    userId?: string;
    emotion?: string;
    priority?: number;
  };
}

/**
 * Événement: blockchain.mint.result
 * Résultat du minting
 */
export interface MintNftResultEvent extends BaseEventMessage {
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
  metadata?: any;  // Reprend les metadata de la requête
}

/**
 * Événement: blockchain.nfts.get
 * Récupérer les NFTs d'un utilisateur
 */
export interface GetUserNftsEvent extends BaseEventMessage {
  userAddress: string;
}

/**
 * Événement: blockchain.nfts.result
 * Résultat de la récupération des NFTs
 */
export interface GetUserNftsResultEvent extends BaseEventMessage {
  success: boolean;
  userAddress: string;
  nfts?: Array<{
    tokenId: number;
    owner: string;
    tokenURI: string;
    onChainData: {
      artist: string;
      timestamp: number;
      title: string;
    };
  }>;
  error?: string;
}

/**
 * Événement: blockchain.nft.get
 * Récupérer les détails d'un NFT
 */
export interface GetNftDetailsEvent extends BaseEventMessage {
  tokenId: number;
}

/**
 * Événement: blockchain.nft.result
 * Résultat des détails du NFT
 */
export interface GetNftDetailsResultEvent extends BaseEventMessage {
  success: boolean;
  nft?: {
    tokenId: number;
    owner: string;
    tokenURI: string;
    onChainData: {
      artist: string;
      timestamp: number;
      title: string;
    };
  };
  error?: string;
}

/**
 * Événement: blockchain.stats.get
 * Récupérer les statistiques
 */
export interface GetStatsEvent extends BaseEventMessage {}

/**
 * Événement: blockchain.stats.result
 * Résultat des statistiques
 */
export interface GetStatsResultEvent extends BaseEventMessage {
  success: boolean;
  stats?: {
    totalMinted: number;
    contractAddress: string;
    network: string;
  };
  error?: string;
}

/**
 * Événement: blockchain.status
 * Statut intermédiaire (optionnel pour le frontend)
 */
export interface StatusEvent extends BaseEventMessage {
  status: 'processing' | 'uploading_image' | 'uploading_metadata' | 'minting' | 'completed' | 'error';
  message: string;
  progress?: number;  // 0-100
}