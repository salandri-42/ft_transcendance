import { Body, Controller, Post} from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('ai')
export class AiController
{
    constructor(private readonly geminiService: GeminiService) {}

    @Post('generate')
    async generateContent(@Body('prompt') prompt: string) : Promise<{ text: string }>
    {
        const text = await this.geminiService.generateText(prompt);
        return { text };
    }
}