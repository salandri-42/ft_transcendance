import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { CreateNftDto } from './dto/create-nft.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  /**
   * POST /blockchain/mint
   * Minter un nouveau NFT avec données métier on-chain
   */
  @Post('mint')
  @HttpCode(HttpStatus.CREATED)
  async mintNFT(@Body() createNftDto: CreateNftDto) {
    return this.blockchainService.mintNFT(createNftDto);
  }

  /**
   * GET /blockchain/nfts/:address
   * Récupérer tous les NFT d'un utilisateur avec données on-chain
   */
  @Get('nfts/:address')
  async getUserNFTs(@Param('address') address: string) {
    return this.blockchainService.getUserNFTs(address);
  }

  /**
   * GET /blockchain/nft/:tokenId
   * Récupérer les détails complets d'un NFT (on-chain + metadata)
   */
  @Get('nft/:tokenId')
  async getNFTDetails(@Param('tokenId') tokenId: string) {
    return this.blockchainService.getNFTDetails(parseInt(tokenId));
  }

  /**
   * GET /blockchain/stats
   * Statistiques globales
   */
  @Get('stats')
  async getStats() {
    return this.blockchainService.getStats();
  }

  /**
   * GET /blockchain/health
   * Health check
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'blockchain',
      timestamp: new Date().toISOString(),
    };
  }
}