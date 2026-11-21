import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const httpsOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.key')),
    cert: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.crt')),
  };

  // Créer l'application NestJS avec HTTPS
  const app = await NestFactory.create(AppModule, { httpsOptions });

  // Récupérer la configuration
  const configService = app.get(ConfigService);
  const blockchainConfig = configService.get('blockchain');
  const redisConfig = configService.get('redis');

  // Afficher la configuration blockchain
  if (blockchainConfig) {
    logger.log('   Blockchain config loaded successfully');
    logger.log(`   Contract: ${blockchainConfig.contractAddress}`);
    logger.log(`   RPC: ${blockchainConfig.rpcUrl}`);
  }

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration CORS (si nécessaire)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Connecter le microservice Redis
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      retryAttempts: redisConfig.retryAttempts,
      retryDelay: redisConfig.retryDelay,
    },
  });

  logger.log('   Redis microservice configured');
  logger.log(`   Host: ${redisConfig.host}:${redisConfig.port}`);

  // Démarrer tous les microservices
  await app.startAllMicroservices();
  logger.log(' Redis microservice started');

  // Démarrer le serveur HTTP (pour debug/health check)
  const port = process.env.PORT || 3004;
  await app.listen(port, '0.0.0.0');

  logger.log(` HTTPS server running on: https://localhost:${port}`);
  logger.log(` Redis microservice listening for events`);
  logger.log('');
  logger.log('   Available event patterns:');
  logger.log('   - blockchain.mint → mint NFT');
  logger.log('   - blockchain.nfts.get → get user NFTs');
  logger.log('   - blockchain.nft.get → get NFT details');
  logger.log('   - blockchain.stats.get → get stats');
  logger.log('');
  logger.log('   Emitted events:');
  logger.log('   - blockchain.mint.result');
  logger.log('   - blockchain.nfts.result');
  logger.log('   - blockchain.nft.result');
  logger.log('   - blockchain.stats.result');
  logger.log('   - blockchain.status (intermediate)');
}

bootstrap();
