import { socket } from './galaxySocket';
// @ts-ignore
import audioProcessorUrl from './audio-processor.ts?worker&url';

/**
 * 
 * @description : Service de capture audio en temps réel.
 *                Capture le microphone de l'utilisateur, downsample le flux en 16kHz via un AudioWorklet,
 *                et l'envoie au backend (Cosmos) via WebSocket.
 * 
 */
class AudioCaptureService
{
	/************************ ATTRIBUTS PRIVES ************************/
	private audioContext: AudioContext | null = null;
	private mediaStream: MediaStream | null = null;
	private workletNode: AudioWorkletNode | null = null;
	private sourceNode: MediaStreamAudioSourceNode | null = null;
	private isRecording = false;
	private isInitializing = false;

	/************************ METHODES ************************/

	/**
	 * 
	 * @description : Démarre la capture audio et l'envoi au backend:
	 *  - Demande l'accès au microphone
	 *  - Initialise le Web Audio Context sur la fréquence native du navigateur
	 *  - Charge l'AudioWorklet
	 *  - Crée les noeuds
	 *  - Réception des chunks PCM 16-bit (Int16Array) depuis le Worklet
	 *  - Envoi direct du buffer binaire au backend via WebSocket
	 * 
	 */
	public async startCapture()
	{
		if (this.isRecording || this.isInitializing)
			return;

		this.isInitializing = true;
		console.log('[AudioCapture] Initializing capture...');

		try
		{
			const stream = await navigator.mediaDevices.getUserMedia(
			{
				audio: {
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true
				}
			});

			if (!this.isInitializing)
			{
				stream.getTracks().forEach(t => t.stop());
				return;
			}

			const ctx = new AudioContext();
			if (ctx.state === 'suspended')
				await ctx.resume();

			await ctx.audioWorklet.addModule(audioProcessorUrl);

			if (!this.isInitializing)
			{
				ctx.close();
				stream.getTracks().forEach(t => t.stop());
				return;
			}

			const source = ctx.createMediaStreamSource(stream);
			const worklet = new AudioWorkletNode(ctx, 'gemini-audio-processor');
			
			worklet.port.onmessage = (event: MessageEvent) =>
			{
				if (!this.isRecording)
					return;
				const pcm16Buffer = event.data as Int16Array;
				socket.emit('stream-audio', pcm16Buffer.buffer);
			};

			source.connect(worklet);
			const zeroGain = ctx.createGain();
			zeroGain.gain.value = 0;
			worklet.connect(zeroGain);
			zeroGain.connect(ctx.destination);

			this.audioContext = ctx;
			this.mediaStream = stream;
			this.sourceNode = source;
			this.workletNode = worklet;

			this.isRecording = true;
			console.log('[AudioCapture] Started capturing and streaming micro to Cosmos.');
		}
		catch (error)
		{
			console.error('[AudioCapture] Error starting capture:', error);
			this.stopCapture();
		}
		finally
		{
			this.isInitializing = false;
		}
	}

	/**
	 * 
	 * @description : Arrête la capture audio.
	 * 
	 */
	public stopCapture()
	{
		this.isRecording = false;
		this.isInitializing = false;

		if (this.workletNode)
		{
			this.workletNode.disconnect();
			this.workletNode = null;
		}
		if (this.sourceNode)
		{
			this.sourceNode.disconnect();
			this.sourceNode = null;
		}
		if (this.audioContext)
		{
			this.audioContext.close();
			this.audioContext = null;
		}
		if (this.mediaStream)
		{
			this.mediaStream.getTracks().forEach(track => track.stop());
			this.mediaStream = null;
		}
		console.log('[AudioCapture] Stopped capture.');
	}
}

export const audioCaptureService = new AudioCaptureService();
