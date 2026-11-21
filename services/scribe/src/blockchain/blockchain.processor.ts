import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { ClientProxy } from '@nestjs/microservices';
import { BlockchainService } from './blockchain.service';
import { MintNftJob, MintNftJobResult } from './interfaces/queue-jobs.interface';
import { StatusEvent } from './interfaces/blockchain-events.interface';

@Processor('blockchain')
export class BlockchainProcessor {
  private readonly logger = new Logger(BlockchainProcessor.name);

  constructor(
    private readonly blockchainService: BlockchainService,
    @Inject('REDIS_CLIENT') private readonly redisClient: ClientProxy,
  ) {}

  @Process('mint-nft')
  async handleMintNft(job: Job<MintNftJob>): Promise<MintNftJobResult> {
    const { requestId, dto, metadata } = job.data;

    this.logger.log(`Processing job [${job.id}] - Request ID: ${requestId}`);
    this.logger.log(`   Attempt: ${job.attemptsMade + 1}/${job.opts.attempts}`);

    try {
      await this.emitStatus(requestId, 'processing', `Processing NFT mint (attempt ${job.attemptsMade + 1})`, 10);
      await job.progress(25);

      await this.emitStatus(requestId, 'uploading_image', 'Uploading to IPFS...', 25);

      const result = await this.blockchainService.mintNFT(dto);

      await job.progress(90);

      const jobResult: MintNftJobResult = {
        requestId,
        success: result.success,
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        tokenURI: result.tokenURI,
        owner: result.owner,
        onChainData: result.onChainData,
        error: result.error,
        attempts: job.attemptsMade + 1,
      };

      if (result.success) {
        this.logger.log(`Job [${job.id}] completed - Token ID: ${result.tokenId}`);
        await this.emitStatus(requestId, 'completed', 'NFT minted successfully', 100);
      } else {
        this.logger.error(`Job [${job.id}] failed - ${result.error}`);
        throw new Error(result.error);
      }

      await job.progress(100);
      return jobResult;
    } catch (error) {
      this.logger.error(`Error in job [${job.id}]:`, error);

      if (job.attemptsMade + 1 >= job.opts.attempts!) {
        await this.emitStatus(requestId, 'error', `Failed after ${job.opts.attempts} attempts: ${error.message}`, 0);
      }

      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job<MintNftJob>) {
    this.logger.log(`  Job [${job.id}] started - Request ID: ${job.data.requestId}`);
  }

  @OnQueueCompleted()
  async onCompleted(job: Job<MintNftJob>, result: MintNftJobResult) {
    this.logger.log(`Job [${job.id}] completed - Request ID: ${job.data.requestId}`);

    this.redisClient.emit('blockchain.mint.result', {
      ...result,
      metadata: job.data.metadata,
      timestamp: Date.now(),
    });
  }

  @OnQueueFailed()
  async onFailed(job: Job<MintNftJob>, error: Error) {
    this.logger.error(`   Job [${job.id}] FAILED after ${job.attemptsMade} attempts`);
    this.logger.error(`   Request ID: ${job.data.requestId}`);
    this.logger.error(`   Error: ${error.message}`);

    const failedResult = {
      requestId: job.data.requestId,
      success: false,
      error: `Failed after ${job.attemptsMade} attempts: ${error.message}`,
      attempts: job.attemptsMade,
      metadata: job.data.metadata,
      timestamp: Date.now(),
    };

    this.redisClient.emit('blockchain.mint.result', failedResult);
  }

  private async emitStatus(
    requestId: string,
    status: StatusEvent['status'],
    message: string,
    progress: number,
  ) {
    const statusEvent: StatusEvent = {
      requestId,
      timestamp: Date.now(),
      status,
      message,
      progress,
    };

    this.redisClient.emit('blockchain.status', statusEvent);
  }
}