import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import pinataSDK from '@pinata/sdk';
import { CreateNftDto } from './dto/create-nft.dto';
import { MintResult, NftMetadata, ArtworkOnChain, NftDetails } from './interfaces/nft-metadata.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as stream from 'stream';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly provider: ethers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;
  private readonly contract: ethers.Contract;
  private readonly pinata: any;

  constructor(private readonly configService: ConfigService) {
    const blockchainConfig = this.configService.get('blockchain');

    this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    this.wallet = new ethers.Wallet(blockchainConfig.privateKey, this.provider);

    const contractABI = this.loadContractABI();
    this.contract = new ethers.Contract(
      blockchainConfig.contractAddress,
      contractABI,
      this.wallet,
    );

    this.pinata = new pinataSDK(
      blockchainConfig.pinata.apiKey,
      blockchainConfig.pinata.secretApiKey,
    );

    this.logger.log(`   BlockchainService initialized`);
    this.logger.log(`   Wallet: ${this.wallet.address}`);
    this.logger.log(`   Contract: ${blockchainConfig.contractAddress}`);
  }

  private loadContractABI(): any {
    const abiPath = path.join(
      __dirname,
      '../../artifacts/contracts/TranscendenceArt.sol/TranscendenceArt.json',
    );

    if (!fs.existsSync(abiPath)) {
      throw new Error(` ABI not found. Run 'npm run hardhat:compile' first.`);
    }

    const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    return artifact.abi;
  }

  /**
   * Upload une image sur IPFS
   */

  async uploadImageToIPFS(imageData: string): Promise<string> {
  this.logger.log(' Uploading image to IPFS...');

  try {
    let buffer: Buffer;

    if (imageData.startsWith('data:image')) {
      const base64Data = imageData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(imageData, 'base64');
    }

    // convertir buffer → stream
    const readableStream = new stream.PassThrough();
    readableStream.end(buffer);

    const result = await this.pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: {
        name: `artwork-${Date.now()}.png`,
      },
    });

    const ipfsUrl = `ipfs://${result.IpfsHash}`;
    this.logger.log(` Image uploaded: ${ipfsUrl}`);

    return ipfsUrl;
  } catch (error) {
    this.logger.error(' Failed to upload image', error);
    throw error;
  }
}


  /**
   * Upload les métadonnées JSON sur IPFS
   */
  async uploadMetadataToIPFS(metadata: NftMetadata): Promise<string> {
    this.logger.log(' Uploading metadata to IPFS...');

    try {
      const result = await this.pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `metadata-${Date.now()}.json`,
        },
      });

      const ipfsUrl = `ipfs://${result.IpfsHash}`;
      this.logger.log(` Metadata uploaded: ${ipfsUrl}`);

      return ipfsUrl;
    } catch (error) {
      this.logger.error(' Failed to upload metadata', error);
      throw error;
    }
  }

  /**
   * Minter un NFT avec données métier on-chain
   */
  async mintNFT(dto: CreateNftDto): Promise<MintResult> {
    this.logger.log(` Minting NFT "${dto.title}" for ${dto.ownerAddress}...`);

    try {
      // 1. Upload l'image sur IPFS
      const imageUrl = await this.uploadImageToIPFS(dto.imageData);

      // 2. Créer les métadonnées
      const metadata: NftMetadata = {
        name: dto.name,
        description: dto.description,
        image: imageUrl,
        attributes: dto.attributes || [],
      };

      // 3. Upload les métadonnées sur IPFS
      const tokenURI = await this.uploadMetadataToIPFS(metadata);

      // 4. Obtenir le prochain token ID
      const nextTokenId = await this.contract.getNextTokenId();
      this.logger.log(`   Next Token ID: ${nextTokenId}`);

      // 5. Minter sur la blockchain avec title (NOUVEAU)
      this.logger.log(`   Sending transaction with title: "${dto.title}"...`);
      const tx = await this.contract.safeMint(
        dto.ownerAddress,
        tokenURI,
        dto.title
      );

      this.logger.log(`   Waiting for confirmation...`);
      this.logger.log(`   Tx Hash: ${tx.hash}`);

      const receipt = await tx.wait();

      // 6. Récupérer les données on-chain
      const [artist, timestamp, title] = await this.contract.getArtwork(nextTokenId);

      const onChainData: ArtworkOnChain = {
        artist,
        timestamp: Number(timestamp),
        title,
      };

      this.logger.log(`   NFT minted successfully!`);
      this.logger.log(`   Block: ${receipt.blockNumber}`);
      this.logger.log(`   On-chain data: artist=${artist}, title="${title}", timestamp=${timestamp}`);

      return {
        success: true,
        tokenId: Number(nextTokenId),
        transactionHash: tx.hash,
        tokenURI,
        owner: dto.ownerAddress,
        onChainData,
      };
    } catch (error) {
      this.logger.error(' Failed to mint NFT', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Récupérer les NFT d'un utilisateur avec données on-chain
   */
  async getUserNFTs(userAddress: string): Promise<NftDetails[]> {
    this.logger.log(` Fetching NFTs for ${userAddress}...`);

    try {
      const tokenIds = await this.contract.tokensOfOwner(userAddress);
      const nfts: NftDetails[] = [];

      for (const tokenId of tokenIds) {
        const nftDetails = await this.getNFTDetails(Number(tokenId));
        nfts.push(nftDetails);
      }

      this.logger.log(` Found ${nfts.length} NFTs`);
      return nfts;
    } catch (error) {
      this.logger.error(' Failed to fetch NFTs', error);
      throw error;
    }
  }

  /**
   * Récupérer les détails complets d'un NFT (on-chain + off-chain)
   */
  async getNFTDetails(tokenId: number): Promise<NftDetails> {
    this.logger.log(` Fetching NFT #${tokenId}...`);

    try {
      // Données de base
      const owner = await this.contract.ownerOf(tokenId);
      const tokenURI = await this.contract.tokenURI(tokenId);

      // Données on-chain (NOUVEAU)
      const [artist, timestamp, title] = await this.contract.getArtwork(tokenId);

      const onChainData: ArtworkOnChain = {
        artist,
        timestamp: Number(timestamp),
        title,
      };

      return {
        tokenId,
        owner,
        tokenURI,
        onChainData,
      };
    } catch (error) {
      this.logger.error(` NFT #${tokenId} not found`, error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques globales
   */
  async getStats(): Promise<any> {
    try {
      const nextTokenId = await this.contract.getNextTokenId();
      const totalMinted = Number(nextTokenId) - 1;

      return {
        totalMinted,
        contractAddress: this.contract.target,
        network: 'Avalanche Fuji Testnet',
      };
    } catch (error) {
      this.logger.error(' Failed to get stats', error);
      throw error;
    }
  }
}