// @ts-nocheck
/// <reference lib="webworker" />

/**
 * 
 * @description : AudioWorkletProcessor pour capturer l'audio du microphone en continu,
 *                le downsampler de la fréquence native (ex: 48kHz) à 16kHz,
 *                et le convertir formellement en PCM 16-bit (Mono) pour Gemini Live API.
 * 
 */
class GeminiAudioProcessor extends AudioWorkletProcessor
{
	/************************ ATTRIBUTS ************************/
	private outSampleRate = 16000;
	private inSampleRate: number;
	private buffer: Float32Array;
	private bufferSize: number;
	private bufferIndex = 0;

	private position = 0;
	private sum = 0;
	private count = 0;

	/************************ CONSTRUCTEUR ************************/
	constructor(options: AudioWorkletNodeOptions)
	{
		super();
		this.inSampleRate = sampleRate;

		this.bufferSize = 256;
		this.buffer = new Float32Array(this.bufferSize);
	}

	/************************ METHODES ************************/

	process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean
	{
		const input = inputs[0];
		if (!input || input.length === 0 || !input[0])
			return true;

		const channelData = input[0];
		const inputLength = channelData.length;

		const ratio = this.inSampleRate / this.outSampleRate;

		for (let i = 0; i < inputLength; i++)
		{
			this.sum += channelData[i];
			this.count++;
			this.position++;

			if (this.position >= ratio)
			{
				const sample = this.sum / this.count;
				this.buffer[this.bufferIndex++] = sample;

				if (this.bufferIndex >= this.bufferSize)
				{
					this.flushBuffer();
					this.bufferIndex = 0;
				}

				this.sum = 0;
				this.count = 0;
				this.position -= ratio;
			}
		}

		return true;
	}

	/**
	 * 
	 * @description : Convertit le buffer en PCM 16-bit et l'envoie au thread principal (AudioCaptureService).
	 * 
	 */
	private flushBuffer()
	{
		const pcm16Buffer = new Int16Array(this.bufferSize);
		for (let i = 0; i < this.bufferSize; i++)
		{
			const s = Math.max(-1, Math.min(1, this.buffer[i]));
			pcm16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
		}

		this.port.postMessage(pcm16Buffer);
	}
}

registerProcessor('gemini-audio-processor', GeminiAudioProcessor);