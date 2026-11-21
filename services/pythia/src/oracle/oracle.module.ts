import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OracleEventsController } from './oracle-events.controller';
import { OracleLiveService } from './oracle-live.service';

@Module({
	imports: [
	ClientsModule.register([
		{
		name: 'REDIS_CLIENT',
		transport: Transport.REDIS,
		options: {
			host: process.env.REDIS_HOST || 'redis',
			port: parseInt(process.env.REDIS_PORT || '6379', 10),
		},
		},
	]),
	],
	controllers: [OracleEventsController],
	providers: [OracleLiveService],
	exports: [OracleLiveService],
})
export class OracleModule {}
