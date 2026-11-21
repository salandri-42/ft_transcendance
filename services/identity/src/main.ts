import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
    const httpsOptions = {
        key: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.key')),
        cert: fs.readFileSync(path.join(process.cwd(), 'certs/nginx.crt')),
    };

    const app = await NestFactory.create(AppModule, { 
        bodyParser: false,
        httpsOptions,
    });

    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));

    app.enableCors();
    await app.listen(process.env.PORT || 3001, '0.0.0.0');
    console.log(`Identity service is running on HTTPS: ${await app.getUrl()}`);
}
bootstrap();
