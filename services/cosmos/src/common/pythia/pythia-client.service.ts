import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

/**
 * 
 * @description : Service interne de Cosmos responsable d'envoyer 
 *                le flux audio binaire au backend IA (Pythia) via le bus Redis.
 * 
 */
@Injectable()
export class PythiaClientService
{
	/* **************** ATTRIBUTES **************** */
	private readonly logger = new Logger(PythiaClientService.name);


	/* **************** CONSTRUCTOR **************** */
	constructor(@Inject('PYTHIA_SERVICE') private readonly client: ClientProxy) { }


	/* **************** METHODS **************** */
	/**
	 * 
	 * @description : Signale à Pythia qu'une nouvelle session Oracle doit être créée
	 *                pour cet utilisateur (ouverture de la connexion Gemini Live).
	 * 
	 */
	public startSession(socketID: string, userID: string | undefined): void
	{
		const resolvedID = userID || socketID;
		this.client.emit('oracle.session.start',
		{
			userId: resolvedID,
			socketId: socketID,
		});
		this.logger.log(`Emitted oracle.session.start for socket: ${socketID}`);
	}

	/**
	 * 
	 * @description : Signale à Pythia que la session Oracle de cet utilisateur doit être fermée
	 *                (fermeture de la connexion Gemini Live).
	 * 
	 */
	public stopSession(socketID: string, userID: string | undefined): void {
		const resolvedID = userID || socketID;
		this.client.emit('oracle.session.stop', {
			userId: resolvedID,
		});
		this.logger.log(`Emitted oracle.session.stop for socket: ${socketID}`);
	}

	/**
	 * 
	 * @description : Pousse le flux audio binaire venant du WebSocket
	 *                dans le bus Redis vers Pythia (event 'oracle.audio').
	 * 
	 */
	public streamAudioToPythia(socketID: string, userID: string | undefined, audioData: ArrayBuffer): void
	{
		const buf = Buffer.from(audioData);

		if (buf.length >= 2)
		{
			let maxVal = 0;
			for (let i = 0; i < buf.length; i += 2)
			{
				const val = Math.abs(buf.readInt16LE(i));
				if (val > maxVal)
					maxVal = val;
			}
			if (maxVal === 0)
				this.logger.warn(`[COSMOS DIAG] SILENCE from frontend! len=${buf.length}`);
			else
				this.logger.debug(`[COSMOS DIAG] Sound! max=${maxVal} len=${buf.length}`);
		}

		const base64Audio = buf.toString('base64');

		this.client.emit('oracle.audio', {
			userId: userID || socketID,
			socketID: socketID,
			payload: base64Audio,
		});
		this.logger.debug(`Relayed binary audio chunk for socket: ${socketID}`);
	}

	/**
	 * 
	 * @description : Emit les donnees de l'etoile cliquee vers Pythia pour que Pythia puisse les utiliser dans la generation de reponse.
	 *                
	 * 
	 */
	public sendStarContextToPythia(socketID: string, userID: string | undefined,
		payload:
		{
			starId: string;
			name: string;
			emotion: string;
			contextEmotion: unknown;
		}): void
	{
		const resolvedID = userID || socketID;

		this.client.emit('star.clicked',
		{
			userId: resolvedID,
			socketId: socketID,
			starId: payload.starId,
			name: payload.name,
			emotion: payload.emotion,
			contextEmotion:
				typeof payload.contextEmotion === 'string'
				? payload.contextEmotion
				: JSON.stringify(payload.contextEmotion),
		});

		this.logger.log(`[STAR_CLICKED] Emitted star.clicked for user=${resolvedID}, starId=${payload.starId}`);
	}
	
	/**
	 * 
	 * @description : Signale à Pythia que l'utilisateur est entré en mode créatif.
	 * 
	 */
	public sendCreativeModeEnter(socketID: string, userID: string | undefined): void
	{
		const resolvedID = userID || socketID;
		this.client.emit('oracle.creative.enter',
		{
			userId: resolvedID,
			socketId: socketID,
		});
		this.logger.log(`[CREATIVE_ENTER] Emitted oracle.creative.enter for user=${resolvedID}`);
		console.log(`[FROM COSMOS CREATIVE_ENTER] Emitted oracle.creative.enter for user=${resolvedID}`);
	}

	/**
	 * 
	 * @description : Signale à Pythia que l'utilisateur a quitté le mode créatif.
	 * 
	 */
	public sendCreativeModeExit(socketID: string, userID: string | undefined): void
	{
		const resolvedID = userID || socketID;
		this.client.emit('oracle.creative.exit',
		{
			userId: resolvedID,
			socketId: socketID,
		});
		this.logger.log(`[CREATIVE_EXIT] Emitted oracle.creative.exit for user=${resolvedID}`);
		console.log(`[FROM COSMOS CREATIVE_EXIT] Emitted oracle.creative.exit for user=${resolvedID}`);
	}

	/**
	 * 
	 * @description : Signale à Pythia que l'utilisateur visite une étoile ou un tableau.
	 * 
	 */
	public sendStarVisit(socketID: string, userID: string | undefined, payload: { starId: string, name: string, emotion: string, contextEmotion: any }): void
	{
		const resolvedID = userID || socketID;
		this.client.emit('oracle.star.visit',
		{
			userId: resolvedID,
			socketId: socketID,
			starId: payload.starId,
			name: payload.name,
			emotion: payload.emotion,
			contextEmotion: typeof payload.contextEmotion === 'string' ? payload.contextEmotion : JSON.stringify(payload.contextEmotion),
		});
		this.logger.log(`[STAR_VISIT] Emitted oracle.star.visit for user=${resolvedID}, starId=${payload.starId}, name=${payload.name}`);
	}

	/**
	 * 
	 * @description : Signale à Pythia que l'utilisateur a quitté le focus d'une étoile ou d'un tableau.
	 * 
	 */
	public sendStarLeave(socketID: string, userID: string | undefined, starId: string): void
	{
		const resolvedID = userID || socketID;
		this.client.emit('oracle.star.leave',
		{
			userId: resolvedID,
			socketId: socketID,
			starId: starId,
		});
		this.logger.log(`[STAR_LEAVE] Emitted oracle.star.leave for user=${resolvedID}, starId=${starId}`);
	}
}
