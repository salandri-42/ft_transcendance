import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from "@google/generative-ai";

@Injectable()
export class AppService {
    getHello(): string {
        return 'Hello World from Pythia!';
    }
}
