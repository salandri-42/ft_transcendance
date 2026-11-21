import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GalaxyGateway } from './galaxy.gateway';
import { ArtworkService } from '../artwork/artwork.service';

/**
 * 
 * @description : Contrôleur Microservice de la galaxie.
 *                Son but est d'écouter le bus interne (Redis) pour attraper les réponses
 *                de Pythia et les re-router vers la Gateway WebSocket Cosmos.
 * 
 */
@Controller()
export class GalaxyController
{
	/* **************** ATTRIBUTES **************** */
	private readonly logger = new Logger(GalaxyController.name);


	/* **************** CONSTRUCTOR **************** */
	constructor(
		private readonly galaxyGateway: GalaxyGateway,
		private readonly artworkService: ArtworkService,
	) { }


	/* **************** METHODS **************** */
	/**
	 * 
	 * @description : Ecoute les reponses audio renvoyees par Pythia sur le reseau Redis interne
	 *                et les transmet au bon client Frontend via WebSocket.
	 * 
	 */
	@EventPattern('oracle.audio.response')
	handleAudioFromPythia(@Payload() data:
	{
		userId?: string,
		socketId: string,
		audioBinary: { type?: string, data?: number[] } | ArrayBuffer | Buffer,
		mimeType?: string,
	})
	{
		if (!data || !data.socketId || !data.audioBinary)
			return;

		let binaryAudio: Buffer;

		if (data.audioBinary && typeof data.audioBinary === 'object' && 'type' in data.audioBinary && data.audioBinary.type === 'Buffer')
			binaryAudio = Buffer.from(data.audioBinary.data);
		else
			binaryAudio = Buffer.from(data.audioBinary as any);

		this.logger.log(`Audio response received for socket: ${data.socketId} (${binaryAudio.length} bytes)`);
		this.galaxyGateway.sendAudioToClient(data.socketId, binaryAudio as unknown as ArrayBuffer);
	}

	/**
	 * 
	 * @description : Ecoute les signaux de peinture envoyés par Pythia sur le réseau Redis interne 
	 * 				  et les transmetau bon client Frontend via WebSocket.
	 * 
	 */
	@EventPattern('oracle.paint.signal')
	handlePaintSignalFromPythia(@Payload() data:
	{
		userId?: string,
		socketId: string,
		emotion?: string,
		contextEmotion?: string,
		suggested_colors?: string[],
		certainty?: string,
	})
	{
		if (!data || !data.socketId)
		{
			this.logger.warn(`Received invalid paint signal from Pythia: ${JSON.stringify(data)}`);
			return;
		}
		
		this.logger.log(`Paint signal received for socket: ${data.socketId} (emotion: ${data.emotion}, certainty: ${data.certainty})`);
		
		if (data.emotion)
		{
			console.log(`[EMOTION_FLOW] Buffering AI analysis for socket ${data.socketId}: ${data.emotion}`);
			this.galaxyGateway.setPendingEmotionalContext(data.socketId,
			{
				emotion: data.emotion,
				contextEmotion: data.contextEmotion,
			});
		}

		this.galaxyGateway.sendPaintSignalToClient(data.socketId,
		{
			emotion: data.emotion,
			contextEmotion: data.contextEmotion,
			suggested_colors: data.suggested_colors,
			certainty: data.certainty,
		});
	}

	/**
	 * @description : Écoute les résultats de minting NFT renvoyés par Scribe.
	 *                Persiste le résultat en base et notifie le frontend.
	 */
	@EventPattern('blockchain.mint.result')
	async handleMintResult(@Payload() data: any)
	{
		this.logger.log(`[BLOCKCHAIN_RESULT] Reception pour requestId: ${data.requestId}`);

		const artworkId = data.metadata?.artworkId;
		const userId = data.metadata?.userId;

		if (data.success && artworkId)
		{
			try
			{
				await this.artworkService.updateMintResult(artworkId, {
					tokenId:  data.tokenId,
					txHash:   data.transactionHash,
					tokenURI: data.tokenURI,
				});
				this.logger.log(`[BLOCKCHAIN_RESULT] Artwork ${artworkId} updated with NFT #${data.tokenId}`);
			}
			catch (error)
			{
				this.logger.error(`[BLOCKCHAIN_RESULT] Failed to update artwork ${artworkId}: ${error.message}`);
			}
		}
		else if (!data.success)
		{
			this.logger.error(`[BLOCKCHAIN_RESULT] Minting failed for requestId ${data.requestId}: ${data.error}`);
		}

		this.galaxyGateway.sendMintResultToClient(userId, {
			success: data.success,
			artworkId,
			tokenId: data.tokenId,
			txHash: data.transactionHash,
			error: data.error,
		});
	}

	/**
	 * @description : Écoute les mises à jour de statut (IPFS, Gas, etc.) envoyées par Scribe.
	 */
	@EventPattern('blockchain.status')
	handleBlockchainStatus(@Payload() data: any)
	{
		this.logger.log(`[BLOCKCHAIN_STATUS] ${data.status} - Request: ${data.requestId}`);
	}
}