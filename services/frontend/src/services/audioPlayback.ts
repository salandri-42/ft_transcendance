import { socket } from './galaxySocket';

/**
 * 
 * @description : Service de lecture audio en streaming.
 *                Écoute les événements WebSocket 'audio-response' provenant du backend (Pythia via Cosmos),
 *                reçoit le flux binaire contenant du PCM 16-bit à 16kHz, le convertit en Float32,
 *                et le lit de manière fluide et consécutive grâce au Web Audio API.
 * 
 */
class AudioPlaybackService
{
	/************************ ATTRIBUTS ************************/
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private nextPlayTime = 0;
	private isPlaying = false;
	private playbackSpeed = 1.40;

	public setPlaybackSpeed(speed: number)
	{
		if (!Number.isFinite(speed))
			return;

		this.playbackSpeed = Math.min(1.4, Math.max(0.8, speed));
		console.log(`[AudioPlayback] Playback speed set to x${this.playbackSpeed.toFixed(2)}.`);
	}

	public getVolume(): number
	{
		if (!this.analyser)
			return 0;
		
		const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
		this.analyser.getByteFrequencyData(dataArray);
		
		let sum = 0;
		for (let i = 0; i < dataArray.length; i++)
			sum += dataArray[i];
		
		return sum / dataArray.length; // Range 0 - 255
	}

	/************************ METHODES ************************/

	/**
	 * 
	 * @description : Démarre l'écoute des événements WebSocket 'audio-response' provenant du backend (Pythia via Cosmos),
	 *                reçoit le flux binaire contenant du PCM 16-bit à 16kHz, le convertit en Float32,
	 *                et le lit de manière fluide et consécutive grâce au Web Audio API.
	 * 
	 */
	public startListening()
	{
		if (this.isPlaying)
			return;
		this.isPlaying = true;
		
		this.audioContext = new AudioContext({ sampleRate: 16000 });
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftSize = 256;
		this.analyser.connect(this.audioContext.destination);
		
		this.nextPlayTime = this.audioContext.currentTime;

		socket.on('audio-response', this.handleAudioResponse);
		console.log('[AudioPlayback] Started listening for audio-response from Cosmos.');
	}

	/**
	 * 
	 * @description : Arrête l'écoute des événements WebSocket 'audio-response' provenant du backend (Pythia via Cosmos).
	 * 
	 */
	public stopListening()
	{
		this.isPlaying = false;
		socket.off('audio-response', this.handleAudioResponse);
		
		if (this.audioContext)
		{
			this.audioContext.close();
			this.audioContext = null;
			this.analyser = null;
		}
		console.log('[AudioPlayback] Stopped listening.');
	}

	/**
	 * 
	 * @description : Gère la réponse audio reçue du backend (Pythia via Cosmos).
	 *                Reçoit le flux binaire PCM 16-bit à 16kHz, le convertit en Float32,
	 *                et le lit de manière fluide et consécutive grâce au Web Audio API.
	 * 
	 */
	private handleAudioResponse = (audioData: ArrayBuffer) =>
	{
		if (!this.audioContext || !this.analyser)
			return;

		try
		{
			const int16Buffer = new Int16Array(audioData);
			
			const float32Buffer = new Float32Array(int16Buffer.length);

			for (let i = 0; i < int16Buffer.length; i++)
				float32Buffer[i] = int16Buffer[i] / 32768.0; 

			const audioBuffer = this.audioContext.createBuffer(1, float32Buffer.length, 16000);
			audioBuffer.copyToChannel(float32Buffer, 0);

			const source = this.audioContext.createBufferSource();
			source.buffer = audioBuffer;
			source.playbackRate.value = this.playbackSpeed;
			
			// On connecte à l'analyseur au lieu de la destination directe
			source.connect(this.analyser);

			const currentTime = this.audioContext.currentTime;

			if (this.nextPlayTime < currentTime)
				this.nextPlayTime = currentTime + 0.01; 

			source.start(this.nextPlayTime);

			this.nextPlayTime += audioBuffer.duration / this.playbackSpeed;
		}
		catch (error)
		{
			console.error('[AudioPlayback] Error decoding and playing audio payload:', error);
		}
	}
}

export const audioPlaybackService = new AudioPlaybackService();
