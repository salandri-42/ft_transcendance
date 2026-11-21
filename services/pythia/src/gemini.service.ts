import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRandomOracleResponse } from './oracle-fallback.constants';

@Injectable()
export class GeminiService
{

	// genAI representera le point d'entree vers Gemini
	private				genAI: GoogleGenerativeAI;
	private readonly	MODEL = "gemini-2.5-flash"; // readonly : impossibilite de modifier apres construction
	private readonly	logger = new Logger(GeminiService.name);
	private readonly	maxRetries = 3;
	
	constructor()
	{
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey)
		{
			throw new Error("GEMINI_API_KEY is not defined in .env\n");
		}
		this.genAI = new GoogleGenerativeAI(apiKey);
	}

	private getModel(model?:string)
	{
		const modelName = model ?? this.MODEL;
		return (this.genAI.getGenerativeModel({model: modelName}));
	}

	async generateText(prompt: string) : Promise<string>
	{
		for (let attempt = 1; attempt <= this.maxRetries; attempt++)
		{
			try
			{
				const modelInstance = this.getModel();
				const result = await modelInstance.generateContent({
					contents: [
						{
							role: "user",
							parts: [{text: prompt}],
						},
					],
				});
				const response = result.response;
				if (!response || !response.text())
				{
					throw new Error("Empty response");
				}
				return response.text().trim(); // trim c'est pour nettoyer les retours a la ligne inutiles
			}
			catch (error)
			{
				this.logger.error(`Gemini failed: ${error.message}`);
				if (attempt == this.maxRetries)
				{
					this.logger.warn('All retries exhausted, using fallback');
					return getRandomOracleResponse();
				}
				const waitTime = 1000 * attempt;
				await this.sleep(waitTime);
			}
		}
	}

	private sleep(ms: number) : Promise<void>
	{
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

}
