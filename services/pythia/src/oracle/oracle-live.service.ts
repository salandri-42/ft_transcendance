import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';

interface LiveSession {
	userId: string;
	socketId: string;
	geminiSession: any | null;
	isActive: boolean;
	createdAt: Date;
	lastActivity: number;      // Timestamp de la dernière interaction
	reconnectAttempts: number; // Compteur de tentatives
	isClosingManually: boolean; // Flag pour savoir si c'est un stop volontaire
	isCreativeMode: boolean; // Flag pour éviter l'envoi en boucle du statut créatif
	lastPaintSignalTime: number; // Pour le debouncing
	lastCreativeExitTime: number; // Pour le cooldown après sortie
}

@Injectable()
export class OracleLiveService {
	private readonly logger = new Logger(OracleLiveService.name);
	private readonly sessions = new Map<string, LiveSession>();

	private readonly systemInstructionText = this.loadSystemInstruction();

	private loadSystemInstruction(): string {
		try {
			const promptPath = join(__dirname, 'prompts', 'system-instruction.md');
			return readFileSync(promptPath, 'utf-8').trim();
		}
		catch (error: any) {
			this.logger.error(`[PROMPT] Unable to load system instruction file: ${error?.message}`);
			return 'Tu es Orel, un guide créatif et empathique.';
		}
	}

	constructor(@Inject('REDIS_CLIENT') private readonly client: ClientProxy) {
		this.startInactivityCleanup();
	}

	private startInactivityCleanup(): void {
		setInterval(() => {
			const now = Date.now();
			const timeout = 5 * 60 * 1000;

			for (const [userId, session] of this.sessions.entries()) {
				if (now - session.lastActivity > timeout) {
					this.logger.warn(`[TIMEOUT] Closing session for ${userId} due to 5min inactivity`);
					this.closeSession(userId);
				}
			}
		}, 60000);
	}

	private updateActivity(userId: string): void {
		const session = this.sessions.get(userId);
		if (session) {
			session.lastActivity = Date.now();
		}
	}

	async initializeSession(userId: string, socketId: string, context?: any): Promise<void> {
		const existingSession = this.sessions.get(userId);
		if (existingSession && existingSession.isActive) {
			this.logger.log(`[SESSION] Reusing active session for ${userId}. Updating socketId: ${socketId}`);
			existingSession.socketId = socketId;
			return;
		}

		if (existingSession) {
			this.logger.warn(`Closing inactive/stale session for ${userId}`);
			await this.closeSession(userId);
		}

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY not configured');
		}

		this.logger.log(`[SESSION_START] Initializing session for ${userId}`);

		const session: LiveSession =
		{
			userId: userId,
			socketId: socketId,
			geminiSession: null,
			isActive: false,
			createdAt: new Date(),
			lastActivity: Date.now(),
			reconnectAttempts: existingSession?.reconnectAttempts || 0,
			isClosingManually: false,
			isCreativeMode: existingSession?.isCreativeMode || false,
			lastPaintSignalTime: 0,
			lastCreativeExitTime: 0,
		};

		this.sessions.set(userId, session);

		try {
			const ai = new GoogleGenAI({ apiKey });
			const modelStr = 'gemini-3.1-flash-live-preview';
			const config =
			{
				thinkingLevel: 'minimal',
				responseModalities: [Modality.AUDIO],
				systemInstruction: {
					parts: [{ text: this.systemInstructionText }]
				},
				speechConfig:
				{
					voiceConfig:
					{
						prebuiltVoiceConfig:
						{
							voiceName: 'Leda', //Kore Leda
						}
					}
				},
				tools:
					[{
						functionDeclarations:
							[
								{
									name: 'trigger_paint_mode',
									description: 'Signal silencieux pour passer le frontend pour indiquer mode peinture',
									parameters:
									{
										type: Type.OBJECT,
										properties:
										{
											emotion: { type: Type.STRING },
											name: { type: Type.STRING, description: 'Le nom suggéré pour la peinture' },
											contextEmotion: { type: Type.STRING },
											suggested_colors:
											{
												type: Type.ARRAY,
												items: { type: Type.STRING },
												description: '5 couleurs HEX ex: #fe62d7',
											},
											certainty:
											{
												type: Type.STRING,
												enum: ['high', 'medium', 'low'],
											},
										},
										required: ['emotion', 'suggested_colors', 'certainty'],
									},
								},
								{
									name: 'trigger_guided_tour_mode',
									description: 'Signal silencieux pour indiquer une demande de visite guidée de la galaxie',
									parameters:
									{
										type: Type.OBJECT,
										properties:
										{
											emotion:
											{
												type: Type.STRING,
												description: 'Emotion que ressent l utilisateur au moment de la demande de visite guidée, obligatoire',
											},
											certainty:
											{
												type: Type.STRING,
												enum: ['high', 'medium', 'low'],
											},
										},
										required: ['emotion', 'certainty'],
									},
								},
							],
					}],
				toolConfig:
				{
					functionCallingConfig: {
						mode: 'AUTO',
						allowedFunctionNames: ['trigger_paint_mode', 'trigger_guided_tour_mode'],
					},
				},
			};

			const geminiLiveSession = await ai.live.connect(
				{
					model: modelStr,
					config: config,
					callbacks:
					{
						onopen: () => {
							this.logger.log(`[GEMINI LIVE SDK] Connected for user: ${userId}`);
							session.isActive = true;
							session.reconnectAttempts = 0;
							session.lastActivity = Date.now();
						},
						onmessage: (message: any) => {
							this.updateActivity(userId);
							try {
								this.logger.debug(`[GEMINI RAW] ${JSON.stringify(message)}`);
								this.logger.debug(`[GEMINI MSG KEYS] ${JSON.stringify(Object.keys(message || {}))}`);

								const parts = message?.serverContent?.modelTurn?.parts;
								if (parts && parts.length > 0) {
									for (const part of parts) {
										const audioContent = part?.inlineData;
										if (audioContent?.data) {
											const audioBase64 = audioContent.data;
											const mimeType = audioContent.mimeType || 'audio/pcm';
											const audioBinary = Buffer.from(audioBase64, 'base64');

											this.client.emit('oracle.audio.response', {
												userId,
												socketId: session.socketId,
												audioBinary: audioBinary,
												mimeType,
												timestamp: new Date(),
											});

											this.logger.log(`[GEMINI RESPONSE] Sent ${audioBinary.length} bytes chunk to Cosmos for ${userId}`);
										}
									}
								}

								const directToolCall = message?.toolCall;
								const batchToolCalls = message?.toolCall?.functionCalls;
								const partFunctionCalls = (message?.serverContent?.modelTurn?.parts || [])
									.map((p: any) => p?.functionCall)
									.filter(Boolean);

								const unifiedCalls: any[] = [];

								if (directToolCall?.name)
									unifiedCalls.push(directToolCall);
								if (Array.isArray(batchToolCalls))
									unifiedCalls.push(...batchToolCalls);
								if (partFunctionCalls.length > 0)
									unifiedCalls.push(...partFunctionCalls);

								const functionResponses: any[] = [];

								for (const call of unifiedCalls) {
									if (call?.name !== 'trigger_paint_mode' && call?.name !== 'trigger_guided_tour_mode')
										continue;

									let args = call?.arguments ?? call?.args ?? {};
									if (typeof args === 'string') {
										try { args = JSON.parse(args); }
										catch { args = {}; }
									}
									if (typeof args !== 'object' || args === null || Array.isArray(args))
										args = {};

									if (call?.name === 'trigger_paint_mode') {
										const now = Date.now();
										const isInCooldown = (now - session.lastCreativeExitTime) < 30000;

										if (session.isCreativeMode || isInCooldown || (now - session.lastPaintSignalTime < 5000)) {
											this.logger.warn(`[PAINT_SIGNAL] Ignored for ${userId} (Mode actif: ${session.isCreativeMode}, Cooldown: ${isInCooldown}, Debounce: ${now - session.lastPaintSignalTime < 5000})`);
											continue;
										}
										session.lastPaintSignalTime = now;

										const emotion = args.emotion;
										const name = args.name;
										const contextEmotion = args.contextEmotion;
										const suggested_colors = Array.isArray(args.suggested_colors) ? args.suggested_colors : [];
										const certainty = args.certainty;

										this.client.emit('oracle.paint.signal', {
											userId,
											socketId: session.socketId,
											emotion,
											name,
											contextEmotion,
											suggested_colors,
											certainty,
											timestamp: new Date(),
										});

										this.logger.log(`[GEMINI SIGNAL] trigger_paint_mode received for ${userId} (name: ${name})`);
									}

									if (call?.name === 'trigger_guided_tour_mode') {
										const emotion = typeof args.emotion === 'string' ? args.emotion : undefined;
										const certainty = args.certainty;

										this.client.emit('oracle.guided_tour.signal', {
											userId,
											socketId: session.socketId,
											emotion,
											certainty,
											timestamp: new Date(),
										});

										this.logger.log(`[GEMINI SIGNAL] trigger_guided_tour_mode received for ${userId}`);
									}
									if (call?.id) {
										functionResponses.push({
											name: call.name,
											id: call.id,
											response: { result: "ok" }
										});
									}
								}
								if (functionResponses.length > 0) {
									try {
										const parts = functionResponses.map(fr => ({
											functionResponse: {
												id: fr.id,
												name: fr.name,
												response: fr.response
											}
										}));
										session.geminiSession.sendRealtimeInput(parts);
										this.logger.log(`[GEMINI SDK] Sent ACK for ${functionResponses.length} tool calls to ${userId}`);
										
										// Verrouillage dynamique des outils
										if (unifiedCalls.some(c => c?.name === 'trigger_paint_mode')) {
											this.updateGeminiConfig(userId);
										}
									}
									catch (err) {
										this.logger.error(`[GEMINI SDK] Failed to send toolResponse: ${err.message}`);
									}
								}

								const hasPaintCall = unifiedCalls.some((c: any) => c?.name === 'trigger_paint_mode');

								if (!hasPaintCall) {
									console.log(`[GEMINI DEBUG] No paint tool call found, checking text for painting intent...`);
									const textParts = (message?.serverContent?.modelTurn?.parts || [])
										.map((p: any) => p?.text)
										.filter(Boolean)
										.join(' ')
										.toLowerCase();

									const intentPeindre =
										textParts.includes('peindre') ||
										textParts.includes('peins') ||
										textParts.includes('paint');

									if (intentPeindre) {
										this.client.emit('oracle.paint.signal', {
											userId,
											socketId: session.socketId,
											emotion: 'unknown',
											suggested_colors: [],
											certainty: 'low',
											timestamp: new Date(),
										});
									}
								}

							}
							catch (error) {
								this.logger.error(`[GEMINI] Error processing SDK message:`, error);
							}

						},
						onerror: (e: any) => {
							this.logger.error(`[GEMINI LIVE SDK] Error for user ${userId}: ${e.message}`);
							session.isActive = false;
						},
						onclose: (e: any) => {
							this.logger.log(`[GEMINI LIVE SDK] Closed for user: ${userId} | reason: ${e.reason}`);
							session.isActive = false;

							if (this.sessions.get(userId) === session) {
								if (!session.isClosingManually && session.reconnectAttempts < 3) {
									const nextAttempt = session.reconnectAttempts + 1;
									this.logger.warn(`[RECONNECT] Unexpected closure for ${userId}. Attempt ${nextAttempt}/3...`);
									setTimeout(() => {
										this.logger.log(`[RECONNECT] Launching reconnection for ${userId}`);
										this.initializeSession(userId, session.socketId);
									}, 3000);
								}
								else {
									this.sessions.delete(userId);
									this.logger.log(`[SESSION] Deleted session storage for ${userId} (Manual close or Max retries)`);
								}
							}
							else {
								this.logger.warn(`[SESSION] onclose ignored for ${userId} : session already replaced.`);
							}
						}
					}
				});

			session.geminiSession = geminiLiveSession;

		}
		catch (error: any) {
			this.logger.error(`[GEMINI LIVE SDK] Connection failed for user ${userId}: ${error.message}`);
			this.sessions.delete(userId);
		}
	}

	async closeSession(userId: string): Promise<void> {
		const session = this.sessions.get(userId);
		if (!session) {
			this.logger.warn(`No active session found for ${userId}`);
			return;
		}

		if (session.geminiSession) {
			try {
				session.isClosingManually = true;
				session.geminiSession.close();
			}
			catch (e) {
				this.logger.error(`[GEMINI LIVE SDK] Error closing session for user ${userId}: ${e.message}`);
			}
		}
		this.sessions.delete(userId);
		this.logger.log(`✓ Session closed for ${userId}`);
	}

	getSession(userId: string): LiveSession | undefined {
		return this.sessions.get(userId);
	}

	async sendAudioBase64ToGemini(userId: string, audioBase64: string, mimeType = 'audio/pcm'): Promise<void> {
		this.updateActivity(userId);
		const session = this.sessions.get(userId);

		if (!session) {
			this.logger.warn(`[AUDIO] No session for user: ${userId}`);
			return;
		}

		if (!session.isActive || !session.geminiSession) {
			this.logger.warn(`[AUDIO] Session not ready for user: ${userId}`);
			return;
		}

		session.geminiSession.sendRealtimeInput
			({
				audio: {
					mimeType: 'audio/pcm;rate=16000',
					data: audioBase64
				}
			});
	}

	async sendStarContextToGemini(userId: string, name: string, emotion: string, contextEmotion: string): Promise<void> {
		this.updateActivity(userId);
		const session = this.sessions.get(userId);

		if (!session) {
			this.logger.warn(`[APP_CONTEXT] No session for user: ${userId}`);
			return;
		}

		if (!session.isActive || !session.geminiSession) {
			this.logger.warn(`[APP_CONTEXT] Session not ready for user: ${userId}`);
			return;
		}

		const contextPayload =
		{
			source: 'app_context',
			contextType: 'star_clicked',
			version: 1,
			timestamp: new Date().toISOString(),
			data: { name, emotion, contextEmotion }
		};

		const contextText =
			`[APP_CONTEXT|DO_NOT_TREAT_AS_USER_SPEECH]\n` +
			`L'utilisateur vient de cliquer sur l'étoile "${name}".\n` +
			`Émotion : ${emotion}\n` +
			`Contexte : ${contextEmotion}\n\n` +
			`Orel, en tant que guide proactif, prends l'initiative de lui parler de cette œuvre immédiatement.\n` +
			`Détails techniques : ${JSON.stringify(contextPayload)}`;

		try {
			session.geminiSession.sendRealtimeInput({ text: contextText });

			this.logger.log(`[APP_CONTEXT] Proactive star context sent for user: ${userId}`);
		}
		catch (error: any) {
			this.logger.error(`[APP_CONTEXT] Failed to send context for user ${userId}: ${error.message}`);
		}
	}

	async sendStarVisitToGemini(userId: string, name: string): Promise<void> {
		this.updateActivity(userId);
		const session = this.sessions.get(userId);
		if (!session || !session.isActive || !session.geminiSession) {
			this.logger.warn(`[STAR_VISIT] No active session for user: ${userId}`);
			return;
		}

		const visitText =
			`[APP_CONTEXT|STAR_ARRIVAL]\n` +
			`L'utilisateur vient d'arriver physiquement (caméra) devant l'étoile "${name}".\n\n` +
			`Orel, prends immédiatement l'initiative de l'accueillir et de lui raconter l'histoire de cette étoile avec poésie. Ne pose pas de question, commence le récit de son émotion.`;

		try {
			session.geminiSession.sendRealtimeInput({ text: visitText });

			this.logger.log(`[STAR_VISIT] Proactive arrival sent for "${name}" (user: ${userId})`);
		}
		catch (error: any) {
			this.logger.error(`[STAR_VISIT] Failed to send visit for user ${userId}: ${error.message}`);
		}
	}

	async sendStarLeaveToGemini(userId: string, starId: string): Promise<void> {
		this.updateActivity(userId);
		const session = this.sessions.get(userId);

		if (!session) {
			this.logger.warn(`[APP_CONTEXT] No session for user: ${userId}`);
			return;
		}

		if (!session.isActive || !session.geminiSession) {
			this.logger.warn(`[APP_CONTEXT] Session not ready for user: ${userId}`);
			return;
		}

		const contextPayload =
		{
			source: 'app_context',
			contextType: 'star_leave',
			version: 1,
			timestamp: new Date().toISOString(),
			data: { starId }
		};

		const contextText =
			`[APP_CONTEXT|DO_NOT_TREAT_AS_USER_SPEECH]\n` +
			`${JSON.stringify(contextPayload)}`;

		try {
			session.geminiSession.sendRealtimeInput({ text: contextText });

			this.logger.log(`[APP_CONTEXT] Star leave sent for user: ${userId}`);
		}
		catch (error: any) {
			this.logger.error(`[APP_CONTEXT] Failed to send star leave for user ${userId}: ${error.message}`);
		}
	}

	async sendCreativeModeEnterToGemini(userId: string): Promise<void> {
		this.updateActivity(userId);
		const session = this.sessions.get(userId);
		if (!session || !session.isActive || !session.geminiSession) return;

		const enterPayload =
		{
			source: 'app_context',
			contextType: 'creative_mode_enter',
			timestamp: new Date().toISOString(),
		};

		const enterText = `[APP_CONTEXT|CREATIVE_ENTER]\n${JSON.stringify(enterPayload)}`;

		try {
			if (session.isCreativeMode) {
				this.logger.debug(`[CREATIVE_ENTER] Ignored for ${userId} (Already in mode)`);
				return;
			}
			session.isCreativeMode = true;

			session.geminiSession.sendRealtimeInput({ text: enterText });
			this.logger.log(`[CREATIVE_ENTER] Sent for user: ${userId}`);
			this.updateGeminiConfig(userId);
		}
		catch (error: any) {
			this.logger.error(`[CREATIVE_ENTER] Error: ${error.message}`);
		}
	}

	async sendCreativeModeExitToGemini(userId: string): Promise<void> {
		this.updateActivity(userId);
		const session = this.sessions.get(userId);
		if (!session || !session.isActive || !session.geminiSession) return;

		if (!session.isCreativeMode) {
			this.logger.debug(`[CREATIVE_EXIT] Ignored for ${userId} (Not in creative mode)`);
			return;
		}
		session.isCreativeMode = false;

		const exitPayload =
		{
			source: 'app_context',
			contextType: 'creative_mode_exit',
			timestamp: new Date().toISOString(),
		};

		const exitText = `[APP_CONTEXT|CREATIVE_EXIT]\n${JSON.stringify(exitPayload)}`;

		try {
			session.geminiSession.sendRealtimeInput({ text: exitText });
			this.logger.log(`[CREATIVE_EXIT] Sent for user: ${userId}`);
			
			// Cooldown de 30s
			session.lastCreativeExitTime = Date.now();
			this.updateGeminiConfig(userId);

			setTimeout(() => {
				this.logger.log(`[COOLDOWN] 30s finished for ${userId}, re-enabling tools.`);
				this.updateGeminiConfig(userId);
			}, 30010);
		}
		catch (error: any) {
			this.logger.error(`[CREATIVE_EXIT] Error: ${error.message}`);
		}
	}

	private async updateGeminiConfig(userId: string): Promise<void> {
		const session = this.sessions.get(userId);
		if (!session || !session.isActive || !session.geminiSession) return;

		try {
			const now = Date.now();
			const isInCooldown = (now - session.lastCreativeExitTime) < 30000;
			const allowedTools = ['trigger_guided_tour_mode'];

			if (!session.isCreativeMode && !isInCooldown) {
				allowedTools.push('trigger_paint_mode');
			}

			if (isInCooldown && !session.isCreativeMode) {
				this.logger.debug(`[CONFIG_UPDATE] Cooldown active for ${userId}, tool paint remains disabled.`);
			}

			await session.geminiSession.updateConfig({
				tools: [{
					functionDeclarations: [
						{
							name: 'trigger_paint_mode',
							description: 'Signal silencieux pour passer le frontend pour indiquer mode peinture',
							parameters: {
								type: Type.OBJECT,
								properties: {
									emotion: { type: Type.STRING },
									name: { type: Type.STRING, description: 'Le nom suggéré pour la peinture' },
									contextEmotion: { type: Type.STRING },
									suggested_colors: {
										type: Type.ARRAY,
										items: { type: Type.STRING },
										description: '5 couleurs HEX ex: #fe62d7',
									},
									certainty: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
								},
								required: ['emotion', 'suggested_colors', 'certainty'],
							},
						},
						{
							name: 'trigger_guided_tour_mode',
							description: 'Signal silencieux pour indiquer une demande de visite guidée de la galaxie',
							parameters: {
								type: Type.OBJECT,
								properties: {
									emotion: { type: Type.STRING, description: 'Emotion ressentie' },
									certainty: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
								},
								required: ['emotion', 'certainty'],
							},
						},
					]
				}],
				toolConfig: {
					functionCallingConfig: {
						mode: 'AUTO',
						allowedFunctionNames: allowedTools,
					}
				}
			});

			this.logger.log(`[CONFIG_UPDATE] Config updated for ${userId}. Allowed tools: ${allowedTools.join(', ')}`);
		}
		catch (error: any) {
			this.logger.error(`[CONFIG_UPDATE] Failed for ${userId}: ${error.message}`);
		}
	}
}
