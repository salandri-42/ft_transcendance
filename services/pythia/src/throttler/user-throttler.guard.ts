import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard
{
	protected async getTracker(req: Record<string, any>): Promise<string>
	{
		const header = req?.headers?.['x-user-id'];
		const userId = Array.isArray(header) ? header[0] : header;

		if (userId) return `user-${userId}`;
		return req?.ip || req?.ips?.[0] || 'unknown';
	}
}