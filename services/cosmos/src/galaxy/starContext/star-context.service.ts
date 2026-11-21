import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StarContextService
{
	private readonly logger = new Logger(StarContextService.name);
	constructor(private readonly prisma: PrismaService) {}
	
	async getStarContext(starId: string)
	{
		const star = await this.prisma.star.findUnique
		({
			where: { id: starId },
			include:
			{
				artworks:
				{
					orderBy: { createdAt: 'desc' },
					take: 1,
				},
			},
		});

		if (!star)
		{
			this.logger.warn(`[STAR_CONTEXT] No star found for starId=${starId}`);
			return null;
		}

		const emotion = star.emotion || (star.artworks[0]?.type ?? 'unknown');
		const contextEmotion = star.contextEmotion || (star.artworks[0]?.data ?? {});

		return {
			starId: star.id,
			name: star.name || star.id,
			emotion: emotion,
			contextEmotion: contextEmotion,
			timestamp: new Date().toISOString(),
			source: 'app_context',
			contextType: 'star_clicked',
			version: 1,
		};
	}
}