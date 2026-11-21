import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { OracleLiveService } from './oracle-live.service';

@Controller()
export class OracleEventsController
{
	private readonly logger = new Logger(OracleEventsController.name);

	constructor(private readonly oracleLiveService: OracleLiveService) { }

	@EventPattern('oracle.session.start')
	async handleSessionStart(payload: any): Promise<void> 
	{
		try 
		{
			const { userId, socketId, history, worldState } = payload;

			this.logger.log(`[EVENT] SESSION_START - userId: ${userId}, socketId: ${socketId}`);

			const contextData =
			{
				history: history || [],
				worldState: worldState || {},
			};

			await this.oracleLiveService.initializeSession(userId, socketId, contextData);

			this.logger.log(`SESSION_START handled for ${userId}`);
		}
		catch (error)
		{
			this.logger.error(`Error handling SESSION_START:`, error);
			throw error;
		}
	}

	@EventPattern('oracle.audio')
	async handleAudio(payload_received: any): Promise<void>
	{
		try
		{
			const { userId, payload, socketId } = payload_received;

			this.logger.log(`[EVENT] AUDIO - userId: ${userId}`);

			let session = this.oracleLiveService.getSession(userId);
			if (!session)
			{
				this.logger.warn(`[AUDIO] No session for userId: ${userId}. Lazy initializing...`);
				const fallbackSocket = socketId || userId;
				await this.oracleLiveService.initializeSession(userId, fallbackSocket);
				session = this.oracleLiveService.getSession(userId);
			}

			if (!session || !session.isActive)
			{
				this.logger.warn(`[AUDIO] Session not active yet for userId: ${userId}`);
				return;
			}

			const audioBase64: string = payload;

			await this.oracleLiveService.sendAudioBase64ToGemini(userId, audioBase64, 'audio/pcm;rate=16000');

			this.logger.log(`AUDIO forwarded to Gemini for ${userId}`);
		}
		catch (error)
		{
			this.logger.error(`Error handling AUDIO:`, error);
			throw error;
		}
	}

	@EventPattern('oracle.session.stop')
	async handleSessionStop(payload: any): Promise<void>
	{
		try
		{
			const { userId } = payload;

			this.logger.log(`[EVENT] SESSION_STOP - userId: ${userId}`);
			await this.oracleLiveService.closeSession(userId);
			this.logger.log(`SESSION_STOP handled for ${userId}`);
		}
		catch (error)
		{
			this.logger.error(`Error handling SESSION_STOP:`, error);
			throw error;
		}
	}

	@EventPattern('star.clicked')
	async handleStarClicked(payload: any): Promise<void>
	{
		try
		{
			const { userId, socketId, starId, name, emotion, contextEmotion } = payload;
			this.logger.log(`[EVENT] STAR_CLICKED - starId: ${starId}`);

			let session = this.oracleLiveService.getSession(userId);

			if (!session)
			{
				this.logger.warn(`[STAR_CLICKED] No session for userId: ${userId}. Lazy initializing...`);
				await this.oracleLiveService.initializeSession(userId, socketId || userId);
				session = this.oracleLiveService.getSession(userId);
			}

			if (!session || !session.isActive)
			{
				this.logger.warn(`[STAR_CLICKED] Session not active yet for userId: ${userId}`);
				return;
			}

			await this.oracleLiveService.sendStarContextToGemini(userId, name, emotion, contextEmotion);

			this.logger.log(`STAR_CLICKED context sent to Gemini for ${userId}`);
		}
		catch (error)
		{
			this.logger.error(`Error handling STAR_CLICKED:`, error);
			throw error;
		}
	}

	@EventPattern('oracle.star.visit')
	async handleStarVisit(payload: any): Promise<void>
	{
		try
		{
			const { userId, name } = payload;
			this.logger.log(`[EVENT] STAR_VISIT - userId: ${userId}, name: ${name}`);

			let session = this.oracleLiveService.getSession(userId);

			if (!session || !session.isActive)
			{
				this.logger.warn(`[STAR_VISIT] No active session for userId: ${userId}`);
				return;
			}

			await this.oracleLiveService.sendStarVisitToGemini(userId, name);
		}
		catch (error)
		{
			this.logger.error(`Error handling STAR_VISIT:`, error);
		}
	}

	@EventPattern('oracle.star.leave')
	async handleStarLeave(payload: any): Promise<void>
	{
		try
		{
			const { userId, starId } = payload;
			this.logger.log(`[EVENT] STAR_LEAVE - starId: ${starId}`);

			let session = this.oracleLiveService.getSession(userId);

			if (!session)
			{
				this.logger.warn(`[STAR_LEAVE] No session for userId: ${userId}. Lazy initializing...`);
				await this.oracleLiveService.initializeSession(userId, userId);
				session = this.oracleLiveService.getSession(userId);
			}

			if (!session || !session.isActive)
			{
				this.logger.warn(`[STAR_LEAVE] Session not active yet for userId: ${userId}`);
				return;
			}

			await this.oracleLiveService.sendStarLeaveToGemini(userId, starId);

			this.logger.log(`STAR_LEAVE sent to Gemini for ${userId}, starId: ${starId}`);
		}
		catch (error)
		{
			this.logger.error(`Error handling STAR_LEAVE:`, error);
			throw error;
		}
	}

	@EventPattern('oracle.creative.enter')
	async handleCreativeEnter(payload: any): Promise<void>
	{
		try
		{
			const { userId } = payload;
			this.logger.log(`[EVENT] CREATIVE_ENTER - userId: ${userId}`);

			let session = this.oracleLiveService.getSession(userId);

			if (!session || !session.isActive) return;

			await this.oracleLiveService.sendCreativeModeEnterToGemini(userId);

			this.logger.log(`CREATIVE_ENTER sent to Gemini for ${userId}`);
			console.log(`CREATIVE_ENTER sent to Gemini for ${userId}`);
		}
		catch (error)
		{
			this.logger.error(`Error handling CREATIVE_ENTER:`, error);
		}
	}

	@EventPattern('oracle.creative.exit')
	async handleCreativeExit(payload: any): Promise<void>
	{
		try
		{
			const { userId } = payload;
			this.logger.log(`[EVENT] CREATIVE_EXIT - userId: ${userId}`);

			let session = this.oracleLiveService.getSession(userId);

			if (!session || !session.isActive) return;

			await this.oracleLiveService.sendCreativeModeExitToGemini(userId);

			this.logger.log(`CREATIVE_EXIT sent to Gemini for ${userId}`);
			console.log(`CREATIVE_EXIT sent to Gemini for ${userId}`);
		}
		catch (error)
		{
			this.logger.error(`Error handling CREATIVE_EXIT:`, error);
		}
	}
}
