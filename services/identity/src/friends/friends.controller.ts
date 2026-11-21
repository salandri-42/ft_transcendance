import {
	Controller,
	Post,
	Delete,
	Get,
	Body,
	Param,
	Req,
	UseGuards,
	UnauthorizedException,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AcceptInviteDto } from './dto/friends.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('friends')
export class FriendsController {
	constructor(private readonly friendsService: FriendsService) {}

	// ─── Authenticated routes ─────────────────────────────────────────────────

	/**
	 * POST /friends/invite
	 * Generate a one-time invite link token for the current user.
	 */
	@UseGuards(JwtAuthGuard)
	@Post('invite')
	async createInvite(@Req() req: any) {
		return this.friendsService.createInvite(req.user.userId);
	}

	/**
	 * POST /friends/invite/accept
	 * Accept an invite using its token. The caller becomes the friend.
	 */
	@UseGuards(JwtAuthGuard)
	@Post('invite/accept')
	async acceptInvite(@Req() req: any, @Body() dto: AcceptInviteDto) {
		return this.friendsService.acceptInvite(req.user.userId, dto.token);
	}

	/**
	 * DELETE /friends/:username
	 * Remove an accepted friend by username.
	 */
	@UseGuards(JwtAuthGuard)
	@Delete(':username')
	async removeFriend(@Req() req: any, @Param('username') friendUsername: string) {
		return this.friendsService.removeFriend(req.user.userId, friendUsername);
	}

	/**
	 * GET /friends
	 * List all accepted friends of the current user.
	 */
	@UseGuards(JwtAuthGuard)
	@Get()
	async getFriends(@Req() req: any) {
		return this.friendsService.getFriends(req.user.userId);
	}

	// ─── Internal service routes ──────────────────────────────────────────────

	/**
	 * POST /friends/internal/filter
	 * Body: { userId: string, usernames: string[] }
	 * Returns which of those usernames are friends with userId.
	 * Called by cosmos to resolve star creator visibility.
	 */
	@Post('internal/filter')
	async filterFriends(
		@Req() req: any,
		@Body() data: { userId: string; usernames: string[] },
	) {
		const secret = req.headers['x-service-secret'];
		if (secret !== process.env.JWT_SECRET) {
			throw new UnauthorizedException('Invalid service secret');
		}
		return this.friendsService.filterFriendUsernames(data.userId, data.usernames);
	}

	/**
	 * GET /friends/internal/:userIdA/:userIdB
	 * Returns { areFriends: boolean }.
	 * Called by cosmos to check star visibility for a specific pair.
	 */
	@Get('internal/:userIdA/:userIdB')
	async checkFriendship(
		@Req() req: any,
		@Param('userIdA') userIdA: string,
		@Param('userIdB') userIdB: string,
	) {
		const secret = req.headers['x-service-secret'];
		if (secret !== process.env.JWT_SECRET) {
			throw new UnauthorizedException('Invalid service secret');
		}
		const result = await this.friendsService.areFriends(userIdA, userIdB);
		return { areFriends: result };
	}
}
