import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	MessageBody,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes, ValidationPipe, Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { GalaxyService } from './galaxy.service';
import {
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData,
} from './interfaces/socket.types';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { StarDataDto } from './dto/star-data.dto';
import { PythiaClientService } from '../common/pythia/pythia-client.service';
import { StarContextService } from './starContext/star-context.service';
import { ArtworkService } from '../artwork/artwork.service';
import { OnGatewayInit } from '@nestjs/websockets';
import { WsAuthMiddleware } from '../common/middleware/ws-auth.middleware';


let SID : string | null = null;
/**
 * 
 * @description : Assure que le gateway agit comme controlleur : 
 *              - il recoit les inputs  en utilisant les DTOs 
 *              - appelle le GalaxyService 
 *              - retourne ou broadcast la reponse
 * 
 */
@WebSocketGateway(
	{
		cors: {
			origin: '*',
		},
		namespace: 'galaxy',
	})
@UseFilters(new WsExceptionFilter())
export class GalaxyGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
	/* **************** PROPERTIES **************** */
	@WebSocketServer()
	server: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

	private logger: Logger = new Logger('GalaxyGateway');
	private clientTargets: Map<string, number> = new Map();
	private pendingEmotionalContext: Map<string, { emotion: string, contextEmotion: any }> = new Map();


	/* **************** CONSTRUCTOR **************** */
	constructor(
		private readonly galaxyService: GalaxyService,
		private readonly pythiaClient: PythiaClientService,
		private readonly starContextService: StarContextService,
		private readonly artworkService: ArtworkService,
		private readonly configService: ConfigService,
		@Inject('SCRIBE_SERVICE') private readonly scribeClient: ClientProxy,
	) { }


	/* **************** METHODS **************** */
	afterInit(server: Server)
	{
		this.logger.log('Galaxy Gateway initialized (namespace: /galaxy)');
		server.use(WsAuthMiddleware());
	}

	handleConnection(client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		this.logger.log(`Client connected: ${client.id}`);
		this.clientTargets.set(client.id, -1);
		const galaxyState = this.galaxyService.getGalaxyState();
		client.emit('init', galaxyState);
		this.pythiaClient.startSession(client.id, client.data?.userId);
	}

	/**
	 * 
	 * @description : Gestion de la deconnexion d'un client
	 * 
	 * @param client : Client qui se deconnecte
	 * 
	 */
	handleDisconnect(client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		this.logger.log(`Client disconnected: ${client.id}`);
		this.clientTargets.delete(client.id);
		this.pendingEmotionalContext.delete(client.id);
		this.pythiaClient.stopSession(client.id, client.data?.userId);
	}

	/**
	 * 
	 * @description : Gestion de la simulation d'un tour guide: 
	 *              - Initialise le mode guide sur le De (-1).
	 *              - Gère le tracking en continu de la cible active.
	 * 
	 * @param client : Client qui effectue le tour guide
	 * 
	 */


	@SubscribeMessage('simulateGuidedTour')
	handleSimulateGuidedTour(@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		this.logger.log(`Starting Guided Tour simulation for ${client.id}`);

		this.clientTargets.set(client.id, -1);
		client.emit('guided_target_update', -1);
	}

	@SubscribeMessage('cycleGuidedTarget')
	handleCycleGuidedTarget(@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		const stars = this.galaxyService.getGalaxyState().stars || [];
		let targetIndex = this.clientTargets.get(client.id) ?? -1;

		targetIndex++;
		if (targetIndex >= stars.length)
			targetIndex = -1;

		this.clientTargets.set(client.id, targetIndex);
		this.logger.log(`Guided Tour [${client.id}] target changed to index: ${targetIndex}`);
		client.emit('guided_target_update', targetIndex);
		if (targetIndex >= 0 && targetIndex < stars.length)
			SID = stars[targetIndex].createdAt?.toString();
	}

	/**
	 * 
	 * @description : Gestion de l'arret d'un tour guide.
	 * 
	 * @param client : Client qui effectue le tour guide
	 * 
	 */
	@SubscribeMessage('stopGuidedTour')
	handleStopGuidedTour(@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		this.logger.log(`Stopping Guided Tour for ${client.id}`);
	}

	@SubscribeMessage('galaxyPing')
	handlePing(@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		client.emit('galaxyPong');
	}

	@UsePipes(new ValidationPipe({ transform: true }))
	@SubscribeMessage('spawnStar')
	handleSpawnStar(
		@MessageBody() data: StarDataDto,
		@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
	)
	{
		this.logger.log(`Star spawn request from ${client.id}`);
		const starId = data.id || `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
		const pendingContext = this.getPendingEmotionalContext(client.id);
		
		const starWithMeta = {
			...data,
			id: starId,
			createdAt: Date.now(),
			ownerId: client.data?.userId || null,
			emotion: pendingContext?.emotion,
			contextEmotion: pendingContext?.contextEmotion,
		};

		if (pendingContext)
		{
			this.logger.log(`[EMOTION_SYNC] Merging buffered emotion "${pendingContext.emotion}" for new star "${starWithMeta.name || starId}"`);
			console.log(`[EMOTION_SYNC] Merging buffered emotion "${pendingContext.emotion}" for new star "${starWithMeta.name || starId}"`);
		}
		else
		{
			this.logger.warn(`[EMOTION_SYNC] No buffered emotion found for new star "${starWithMeta.name || starId}"`);
			console.log(`[EMOTION_SYNC] No buffered emotion found for new star "${starWithMeta.name || starId}"`);
		}

		this.galaxyService.addStar(starWithMeta);
		this.server.emit('newStar', starWithMeta);
		return { status: 'ok', sentTo: 'all' };
	}

	/**
	 * 
	 * @description : Reception du flux audio binaire continu (PCM 16-bit 16kHz) depuis le Frontend.
	 *                Ici, Cosmos joue le rôle de Proxy pass-through. Le flux sera ensuite redirige vers Pythia.
	 *
	 */
	@SubscribeMessage('stream-audio')
	handleStreamAudio(
		@MessageBody() audioData: ArrayBuffer,
		@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
	)
	{
		this.pythiaClient.streamAudioToPythia(client.id, client.data?.userId, audioData);
	}

	/**
	 * 
	 * @description : Un utilisateur a clique sur une etoile. Cosmos recoit l'event afin de receuillir les donnees dans 
	 * 				base de donnees pour ensuite les transmettre à Pythia et les reponses de pythia seront en accord avec un bon contexte.
	 */
	@SubscribeMessage('starClicked')
	async handleStarClicked(
		@MessageBody() starId: string,
		@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
	)
	{
		if (!starId || typeof starId !== 'string')
		{
			this.logger.warn(`[STAR_CLICKED] Invalid or missing payload(star ID) from ${client.id}`);
			return;
		}

		this.logger.log(`Star clicked event received for star ID: ${starId} from client: ${client.id}`);
		const userId = client.data?.userId || client.id;
		this.logger.log(`[STAR_CLICKED] Received starId=${starId} from userId=${userId}`);

		const starContext = await this.starContextService.getStarContext(starId);

		if (!starContext)
		{
			this.logger.warn(`[STAR_CLICKED] No context found for starId=${starId}`);
			return;
		}

		this.logger.log(`[STAR_CLICKED] Context ready for starId=${starId}, emotion=${starContext.emotion}`);
		this.pythiaClient.sendStarContextToPythia(client.id, client.data?.userId, {
			starId,
			name: starContext.name,
			emotion: starContext.emotion,
			contextEmotion: starContext.contextEmotion,
		});
		this.logger.log(`[STAR_CLICKED] Emitted oracle.star.clicked for starId=${starId} to Pythia`);
	}

	@SubscribeMessage('enterCreativeMode')
	handleEnterCreativeMode(@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		this.logger.log(`[ENTER_CREATIVE] Received from ${client.id}`);
		this.pythiaClient.sendCreativeModeEnter(client.id, client.data?.userId);
	}

	@SubscribeMessage('exitCreativeMode')
	handleExitCreativeMode(@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>)
	{
		this.logger.log(`[EXIT_CREATIVE] Received from ${client.id}. Cleaning emotion buffer.`);
		this.pendingEmotionalContext.delete(client.id);
		this.pythiaClient.sendCreativeModeExit(client.id, client.data?.userId);
	}

	@SubscribeMessage('visitStar')
	async handleVisitStar(
		@MessageBody() starId: string,
		@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
	)
	{
		if (!starId) return;
		this.logger.log(`[VISIT_STAR] starId=${starId} from ${client.id}`);
		console.log(`[GALAXY GATEWAY] User ${client.data?.userId || client.id} is visiting star: ${starId}`);
		
		const context = await this.starContextService.getStarContext(starId);
		if (context)
		{
			this.pythiaClient.sendStarVisit(client.id, client.data?.userId, {
				starId: context.starId,
				name: context.name,
				emotion: context.emotion,
				contextEmotion: context.contextEmotion,
			});
			console.log(`[GALAXY GATEWAY] Sent visit data for "${context.name}" to Pythia`);
		}
		else
		{
			this.pythiaClient.sendStarVisit(client.id, client.data?.userId,
			{
				starId,
				name: 'Unknown Star',
				emotion: 'unknown',
				contextEmotion: {},
			});
		}
	}

	/**
	 * 
	 * @description : 
	 * 
	 */
	@SubscribeMessage('leaveStar')
	handleLeaveStar(
		@MessageBody() starId: string,
		@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
	)
	{
		if (!starId) return;
		this.logger.log(`[LEAVE_STAR] starId=${starId} from ${client.id}`);
		this.pythiaClient.sendStarLeave(client.id, client.data?.userId, starId);
	}

	/**
	 * 
	 * @description : Appelee par le GalaxyController quand Pythia (via Redis) a genere
	 *                une reponse auditive qu'il faut pousser dans les oreilles du joueur.
	 * 
	 */
	public sendAudioToClient(clientID: string, audioData: ArrayBuffer)
	{
		this.server.to(clientID).emit('audio-response', audioData);
	}

	/**
	 * 
	 * @description : Appelee par le GalaxyController quand Pythia (via Redis) a genere
	 *                un signal mode peinture qu'il faut passer a frontend.
	 * 
	 */
	public sendPaintSignalToClient(clientID: string, signalData: { emotion?: string, contextEmotion?: string, suggested_colors?: string[], certainty?: string })
	{
		this.server.to(clientID).emit('paint-signal', signalData);
	}

	public setPendingEmotionalContext(socketId: string, data: { emotion: string, contextEmotion: any })
	{
		this.pendingEmotionalContext.set(socketId, data);
		this.logger.log(`[EMOTION_BUFFER] Buffered signal for socket: ${socketId} (emotion: ${data.emotion})`);
	}

	public getPendingEmotionalContext(socketId: string): { emotion: string, contextEmotion: any } | null
	{
		return this.pendingEmotionalContext.get(socketId) || null;
	}

	/**
	 * @description : Notifie le client frontend du résultat du minting NFT via WebSocket.
	 */
	public sendMintResultToClient(userId: string, resultData: any)
	{
		this.server.emit('mint-result', resultData);
	}

	/**
	 * 
	 * @description : Appelee par le GalaxyController quand l'utilisateur partage et sauvegarde son artwork.
	 * 
	 * @param payload : Payload contenant l'ID de l'etoile et le buffer de l'image
	 * @param client : Client qui effectue l'action
	 * 
	 */
	@SubscribeMessage('saveArtwork')
	async handleSaveArtwork(
		@MessageBody() payload: { starId: string, imageBuffer: ArrayBuffer, name?: string },
		@ConnectedSocket() client: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
	)
	{
		const ownerId = client.data?.userId;
		if (!ownerId)
		{
			this.logger.error('[SAVE_ARTWORK] Unauthorized: missing userId in socket data');
			return;
		}

		try
		{
			const buffer = Buffer.from(payload.imageBuffer);
			
			const dto = {
				ownerId: ownerId,
				starId: payload.starId,
				title: payload.name ?? payload.starId,
			};

			const savedArtwork = await this.artworkService.create(dto, buffer, 'image/jpeg');
			this.logger.log(`[SAVE_ARTWORK] Artwork created for star ${payload.starId}. ID: ${savedArtwork.id} (${buffer.length} bytes)`);

			const pendingContext = this.getPendingEmotionalContext(client.id);
			if (pendingContext)
			{
				await this.galaxyService.updateStarEmotion(payload.starId, pendingContext.emotion, pendingContext.contextEmotion);
			}

			const ownerAddress = this.configService.get<string>('SCRIBE_WALLET_ADDRESS');
			
			const mintPayload = {
				requestId: randomUUID(),
				timestamp: Date.now(),
				title: dto.title,
				name: `Transcendance ${payload.name || payload.starId}`,
				description: `Œuvre générée par ${ownerId} lors d'un voyage stellaire.`,
				imageData: buffer.toString('base64'),
				ownerAddress: ownerAddress,
				attributes: [
					{ trait_type: 'Émotion', value: pendingContext?.emotion || 'Unknown' },
					{ trait_type: 'Star ID', value: payload.starId },
					{ trait_type: 'Source', value: 'Orel Cosmic Dice' }
				],
				metadata: {
					artworkId: savedArtwork.id,
					userId: ownerId,
					emotion: pendingContext?.emotion
				}
			};

			this.logger.log(`[SCRIBE_INTEGRATION] Sending mint request to Scribe for artwork ${savedArtwork.id}`);
			this.scribeClient.emit('blockchain.mint', mintPayload);
		}
		catch (error)
		{
			this.logger.error(`[SAVE_ARTWORK] Error saving artwork or emitting to Scribe for star ${payload.starId}:`, error);
		}
	}
}
