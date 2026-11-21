// import	{
// 			WebSocketGateway,
// 			WebSocketServer,
// 			SubscribeMessage,
// 			OnGatewayConnection,
// 			OnGatewayDisconnect,
// 			ConnectedSocket,
// 			MessageBody,
// 		} from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Logger } from '@nestjs/common';
// import { OracleLiveService } from './oracle-live.service';

// // Passerelle : agit comme un controleur pour les sockets
// @WebSocketGateway
// ({
// 	namespace: 'oracle',
// 	cors: { origin: '*', }, // Autorise les connexions de n'importe quelle origine
// })
// export class OracleGateway implements OnGatewayConnection, OnGatewayDisconnect
// {
// 	@WebSocketServer() server: Server; // Instance du serveur Socket.IO 
// 	private logger: Logger = new Logger('OracleGateway');
// 	constructor(private readonly oracleLiveService: OracleLiveService) {}

// 	async	handleConnection(client: Socket)
// 	{
// 		const userId = client.handshake.query.userId; 
// 		if (!userId)
// 		{
// 			this.logger.error(`Connection rejetée : userId manquant`);
// 			client.disconnect();
// 			return;
// 		}
// 		await this.oracleLiveService.initializeSession(userId as string, client.id);
//     	this.logger.log(`Oracle Client ${client.id} connecté pour l'user ${userId}`);
//     	// C'est ici qu'on appellera plus tard : this.historyService.getHistory(userId)
// 	}

// 	async	handleDisconnect(client: Socket)
// 	{
// 		const userId = client.handshake.query.userId;
// 		if (userId)
// 			await this.oracleLiveService.closeSession(userId as string);
// 		this.logger.log(`Oracle Client disconnected: ${client.id}`);
// 	}

// 	@SubscribeMessage('stream-audio') //Sera appelE lorsque le client fera socket.emit("stream-audio", data);
// 	async handleAudioStream(@ConnectedSocket() client: Socket, @MessageBody() chunk: Buffer): Promise<void>
// 	{
// 		if (Buffer.isBuffer(chunk))
// 		{
// 			this.logger.log(`[AUDIO] Reçu chunk de ${chunk.length} octets`);
// 			const userId = client.handshake.query.userId;
// 			if (!userId)
// 			{
// 				this.logger.warn('Audio received but userId missing');
// 				return ;
// 			}
			
// 			// Assure que userId est un string (pas un tableau)
// 			const userIdString = Array.isArray(userId) ? userId[0] : userId;
			
// 			if (Buffer.isBuffer(chunk))
// 			{
// 				this.logger.log(`[AUDIO] Reçu chunk de ${chunk.length} octets pour user ${userIdString}`);
// 				await this.oracleLiveService.sendAudioToGemini(userIdString, chunk);
// 			}
// 			// C'est ce 'chunk' qu'on enverra à Gemini Live
// 		}
// 	}
// }