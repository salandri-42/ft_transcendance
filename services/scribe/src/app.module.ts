/* 
 *  Version 1 fonctionnelle
 */

// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import blockchainConfig from './config/blockchain.config';
// import { BlockchainModule } from './blockchain/blockchain.module';

// @Module({
//     imports: [
//         ConfigModule.forRoot({
//         isGlobal: true,
//         load: [blockchainConfig],
//         envFilePath: '.env',
//         }),
//         BlockchainModule,
//     ],
//     controllers: [AppController],
//     providers: [AppService],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './blockchain/blockchain.module';
import blockchainConfig from './config/blockchain.config';
import redisConfig from './config/redis.config';
import queueConfig from './config/queue.config'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [blockchainConfig, redisConfig, queueConfig],
      envFilePath: '.env',
    }),
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}