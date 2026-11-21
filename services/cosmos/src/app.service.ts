import { Injectable } from '@nestjs/common';

/**
 * 
 * @description : Service principal de l'application
 * 
 */
@Injectable()
export class AppService
{
    getHello(): string
    {
        return 'Hello World from Cosmos!';
    }
}
