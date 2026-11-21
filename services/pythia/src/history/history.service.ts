import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class HistoryService
{
	constructor(@InjectRedis() private readonly redis: Redis) {}

	async addMessage(userId: string, message: object, maxMessages: number = 10): Promise<void>
	{
		const key = `chat:history:${userId}`;
		await this.redis.rpush(key, JSON.stringify(message)); // stringify est pour transformer l'objet javascript en texte
		await this.redis.ltrim(key, -maxMessages, -1);
		await this.redis.expire(key, 3600 * 24); // Expire après 24h d'inactivitE
	}

	async getHistory(userId: string, limit?: number): Promise<any[]>
	{
		const key = `chat:history:${userId}`;
		const start = limit ? -limit : 0;
		const messages = await this.redis.lrange(key, start, -1);
		return messages.map(msg => JSON.parse(msg)); // parse convertit les strings JSOn en objets JavaScript et map transforme chaque element du tableau
	}

	async clearHistory(userId: string): Promise<void>
	{
		const key = `chat:history:${userId}`;
		await this.redis.del(key);
	}
}