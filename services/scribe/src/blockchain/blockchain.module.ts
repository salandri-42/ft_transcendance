import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlockchainController } from './blockchain.controller';
import { BlockchainEventsController } from './blockchain.events.controller';
import { BlockchainService } from './blockchain.service';
import { BlockchainProcessor } from './blockchain.processor';

@Module({
  imports: [
    // Configuration BullMQ
    BullModule.registerQueueAsync({
      name: 'blockchain',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const queueConfig = configService.get('queue');
        return {
          redis: queueConfig.redis,
          defaultJobOptions: queueConfig.defaultJobOptions,
          limiter: queueConfig.limiter,
        };
      },
      inject: [ConfigService],
    }),
    // Configuration Redis Client
    ClientsModule.registerAsync([
      {
        name: 'REDIS_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const redisConfig = configService.get('redis');
          return {
            transport: Transport.REDIS,
            options: {
              host: redisConfig.host,
              port: redisConfig.port,
              password: redisConfig.password,
              retryAttempts: redisConfig.retryAttempts,
              retryDelay: redisConfig.retryDelay,
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    BlockchainController,
    BlockchainEventsController,
  ],
  providers: [
    BlockchainService,
    BlockchainProcessor,
  ],
  exports: [BlockchainService],
})
export class BlockchainModule {}
