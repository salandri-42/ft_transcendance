import { Controller, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientProxy } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BlockchainService } from './blockchain.service';
import {
  MintNftEvent,
  MintNftResultEvent,
  GetUserNftsEvent,
  GetUserNftsResultEvent,
  GetNftDetailsEvent,
  GetNftDetailsResultEvent,
  GetStatsEvent,
  GetStatsResultEvent,
  StatusEvent,
} from './interfaces/blockchain-events.interface';
import { MintNftJob } from './interfaces/queue-jobs.interface';
import { CreateNftDto } from './dto/create-nft.dto';

@Controller()
export class BlockchainEventsController {
  private readonly logger = new Logger(BlockchainEventsController.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
    @InjectQueue('blockchain') private readonly blockchainQueue: Queue,
  ) {}

  /**
   * Événement: blockchain.mint
   * Ajoute le job à la queue BullMQ
   */
  @EventPattern('blockchain.mint')
  async handleMintNft(@Payload() data: MintNftEvent) {
    const { requestId, metadata, ...nftData } = data;
    this.logger.log(`[blockchain.mint] Request ID: ${requestId}`);

    try {
      const dto: CreateNftDto = {
        title: nftData.title,
        name: nftData.name,
        description: nftData.description,
        imageData: nftData.imageData,
        ownerAddress: nftData.ownerAddress,
        attributes: nftData.attributes,
      };

      const job: MintNftJob = {
        requestId,
        dto,
        metadata,
      };

      const priority = metadata?.priority || 5;

      const addedJob = await this.blockchainQueue.add('mint-nft', job, {
        priority: 10 - priority,
        jobId: requestId,
      });

      this.logger.log(`Job added to queue [${addedJob.id}] - Priority: ${priority}`);

      // Statut "queued"
      const statusEvent: StatusEvent = {
        requestId,
        timestamp: Date.now(),
        status: 'processing',
        message: 'NFT mint job queued',
        progress: 0,
      };

      this.redisClient.emit('blockchain.status', statusEvent);
    } catch (error) {
      this.logger.error(`Failed to queue job:`, error);

      const errorResponse: MintNftResultEvent = {
        requestId,
        timestamp: Date.now(),
        success: false,
        error: error.message,
        metadata,
      };

      this.redisClient.emit('blockchain.mint.result', errorResponse);
    }
  }

  /**
   * Événement: blockchain.nfts.get
   */
  @EventPattern('blockchain.nfts.get')
  async handleGetUserNfts(@Payload() data: GetUserNftsEvent) {
    const { requestId, userAddress } = data;
    this.logger.log(`[blockchain.nfts.get] User: ${userAddress}`);

    try {
      const nfts = await this.blockchainService.getUserNFTs(userAddress);

      const response: GetUserNftsResultEvent = {
        requestId,
        timestamp: Date.now(),
        success: true,
        userAddress,
        nfts,
      };

      this.logger.log(`Found ${nfts.length} NFTs`);
      this.redisClient.emit('blockchain.nfts.result', response);
    } catch (error) {
      this.logger.error(`Error:`, error);

      const errorResponse: GetUserNftsResultEvent = {
        requestId,
        timestamp: Date.now(),
        success: false,
        userAddress,
        error: error.message,
      };

      this.redisClient.emit('blockchain.nfts.result', errorResponse);
    }
  }

  /**
   * Événement: blockchain.nft.get
   */
  @EventPattern('blockchain.nft.get')
  async handleGetNftDetails(@Payload() data: GetNftDetailsEvent) {
    const { requestId, tokenId } = data;
    this.logger.log(`[blockchain.nft.get] Token ID: ${tokenId}`);

    try {
      const nft = await this.blockchainService.getNFTDetails(tokenId);

      const response: GetNftDetailsResultEvent = {
        requestId,
        timestamp: Date.now(),
        success: true,
        nft,
      };

      this.logger.log(`NFT #${tokenId} retrieved`);
      this.redisClient.emit('blockchain.nft.result', response);
    } catch (error) {
      this.logger.error(`Error:`, error);

      const errorResponse: GetNftDetailsResultEvent = {
        requestId,
        timestamp: Date.now(),
        success: false,
        error: error.message,
      };

      this.redisClient.emit('blockchain.nft.result', errorResponse);
    }
  }

  /**
   * Événement: blockchain.stats.get
   */
  @EventPattern('blockchain.stats.get')
  async handleGetStats(@Payload() data: GetStatsEvent) {
    const { requestId } = data;
    this.logger.log(`[blockchain.stats.get]`);

    try {
      const stats = await this.blockchainService.getStats();

      const response: GetStatsResultEvent = {
        requestId,
        timestamp: Date.now(),
        success: true,
        stats,
      };

      this.logger.log(`Stats retrieved`);
      this.redisClient.emit('blockchain.stats.result', response);
    } catch (error) {
      this.logger.error(`Error:`, error);

      const errorResponse: GetStatsResultEvent = {
        requestId,
        timestamp: Date.now(),
        success: false,
        error: error.message,
      };

      this.redisClient.emit('blockchain.stats.result', errorResponse);
    }
  }
}