import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserThrottlerGuard } from './throttler/user-throttler.guard';
import { AiController } from './ai.controller';
import { RedisModule } from '@nestjs-modules/ioredis';
import { HistoryModule } from './history/history.module';
import { OracleModule } from './oracle/oracle.module';


@Module({
    imports:
    [
		ConfigModule.forRoot({ isGlobal: true }), // ConfigModule module pour avoir acces au contenu du fichier .env dans process.env
		AiModule,
		HistoryModule,
		OracleModule,
		ThrottlerModule.forRoot
		([{
			ttl: 60000,
			limit: 10,
		}]),
		RedisModule.forRoot({
			type: 'single',
			url: process.env.REDIS_URL || 'redis://redis:6379',
		}),
	],
    controllers: [AppController, AiController],
    providers:
    [
        AppService,
        {
            provide: APP_GUARD,
            useClass: UserThrottlerGuard,
        },
    ],
})
export class AppModule {}
