import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException, Error)
export class WsExceptionFilter extends BaseWsExceptionFilter
{
	private logger = new Logger('WsExceptionFilter');

	catch(exception: Error | WsException, host: ArgumentsHost)
	{
		const client = host.switchToWs().getClient<Socket>();
		const errorDetails = exception instanceof WsException ? exception.getError() : exception.message;

		this.logger.error(`WebSocket Error on client ${client.id}:`, errorDetails);

		client.emit('error', {
			message: typeof errorDetails === 'string' ? errorDetails : (errorDetails as any).message || 'Internal server error',
		});
	}
}
