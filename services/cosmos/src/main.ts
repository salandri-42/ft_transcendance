import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

/**
 * 
 * @description : Fonction de bootstrap de l'application. Son role est de 
 *              - creer l'application
 *              - configurer le socket
 *              - demarrer l'application ainsi que l'écoute du bus Microservice Redis
 * 
 */
async function bootstrap()
{
    const httpsOptions = {
        key: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.key')),
        cert: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.crt')),
    };

    const app = await NestFactory.create(AppModule, { httpsOptions });

    app.connectMicroservice<MicroserviceOptions>(
    {
        transport: Transport.REDIS,
        options: {
            host: process.env.REDIS_HOST || 'redis',
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
        },
    });

    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

    await app.startAllMicroservices();
    
    await app.listen(process.env.PORT || 3002, '0.0.0.0', async () =>
    {
        console.log(`Cosmos service is running on: ${await app.getUrl()}`);
    });
}

bootstrap();
