import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap()
{
    const httpsOptions = {
        key: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.key')),
        cert: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.crt')),
    };

    const app = await NestFactory.create(AppModule, { httpsOptions });

    app.connectMicroservice<MicroserviceOptions>
	({
        transport: Transport.REDIS,
        options: {
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
    });

    await app.startAllMicroservices();
    await app.listen(process.env.PORT || 3003, '0.0.0.0');
    console.log(`Pythia service is running on: ${await app.getUrl()}`);
}
bootstrap();
