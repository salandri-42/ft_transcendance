import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
	constructor(private readonly prisma: PrismaService) {}

	// ─── Invite System ────────────────────────────────────────────────────────

	/**
	 * Generates a short, human-readable invite code (6 chars, uppercase alphanumeric).
	 */
	private generateShortCode(length = 6): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I to avoid confusion
		let code = '';
		for (let i = 0; i < length; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	}

	/**
	 * Creates a one-time invite code for the authenticated user.
	 * The code expires in 15 minutes.
	 */
	async createInvite(senderId: string): Promise<{ token: string; expiresAt: Date }> {
		const user = await this.prisma.user.findUnique({ where: { id: senderId } });
		if (!user) {
			throw new UnauthorizedException('User not found in database. Please login again.');
		}

		const expiresAt = new Date();
		expiresAt.setMinutes(expiresAt.getMinutes() + 15);

		// Retry in case of (unlikely) collision
		let token = this.generateShortCode();
		for (let i = 0; i < 5; i++) {
			const existing = await this.prisma.friendInvite.findUnique({ where: { token } });
			if (!existing) break;
			token = this.generateShortCode();
		}

		const invite = await this.prisma.friendInvite.create({
			data: {
				token,
				senderId,
				expiresAt,
			},
		});

		return { token: invite.token, expiresAt: invite.expiresAt };
	}

	/**
	 * Accepts an invite token.
	 * - Validates the token (exists, not expired, not already used)
	 * - Prevents self-invite acceptance
	 * - Creates a PENDING friendship request from sender → acceptor
	 *   then immediately marks it ACCEPTED (since the acceptor clicked the link)
	 */
	async acceptInvite(acceptorId: string, token: string): Promise<{ success: boolean; message: string }> {
		const invite = await this.prisma.friendInvite.findUnique({ where: { token } });

		if (!invite) {
			return { success: false, message: 'Invite not found' };
		}
		if (invite.usedAt) {
			return { success: false, message: 'Invite has already been used' };
		}
		if (invite.expiresAt < new Date()) {
			return { success: false, message: 'Invite has expired' };
		}
		if (invite.senderId === acceptorId) {
			return { success: false, message: 'You cannot accept your own invite' };
		}

		// Verify that both users exist to debug foreign key violation
		const acceptor = await this.prisma.user.findUnique({ where: { id: acceptorId } });
		if (!acceptor) {
			console.error(`Acceptor user not found: ${acceptorId}`);
			throw new NotFoundException('Your user account was not found');
		}

		const sender = await this.prisma.user.findUnique({ where: { id: invite.senderId } });
		if (!sender) {
			console.error(`Sender user not found: ${invite.senderId}`);
			throw new NotFoundException('Invite sender no longer exists');
		}

		// Check for existing friendship (in either direction)
		const existing = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ requesterId: invite.senderId, addresseeId: acceptorId },
					{ requesterId: acceptorId, addresseeId: invite.senderId },
				],
			},
		});

		if (existing) {
			if (existing.status === 'ACCEPTED') {
				return { success: false, message: 'You are already friends with this user' };
			}
			// If PENDING, just accept it
			await this.prisma.friendship.update({
				where: { id: existing.id },
				data: { status: 'ACCEPTED' },
			});
			console.log(`[IDENTITY LOG] Des users sont devenus amis : ${acceptor.username} et ${sender.username}`);
		} else {
			// Create an immediately accepted friendship
			try {
				await this.prisma.friendship.create({
					data: {
						requesterId: invite.senderId,
						addresseeId: acceptorId,
						status: 'ACCEPTED',
					},
				});
				console.log(`[IDENTITY LOG] Des users sont devenus amis : ${acceptor.username} et ${sender.username}`);
			} catch (err) {
				console.error('Failed to create friendship:', {
					senderId: invite.senderId,
					acceptorId: acceptorId,
					error: err
				});
				throw err;
			}
		}

		// Mark the invite as used
		await this.prisma.friendInvite.update({
			where: { token },
			data: { usedAt: new Date() },
		});

		return { success: true, message: 'Friend added successfully' };
	}

	// ─── Friend Management ────────────────────────────────────────────────────

	/**
	 * Removes a friendship between the current user and the given username.
	 * Works regardless of who was the requester/addressee.
	 */
	async removeFriend(userId: string, friendUsername: string): Promise<{ message: string }> {
		const friend = await this.prisma.user.findUnique({
			where: { username: friendUsername },
		});

		if (!friend) {
			throw new NotFoundException(`User "${friendUsername}" not found`);
		}

		const friendship = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ requesterId: userId, addresseeId: friend.id, status: 'ACCEPTED' },
					{ requesterId: friend.id, addresseeId: userId, status: 'ACCEPTED' },
				],
			},
		});

		if (!friendship) {
			throw new NotFoundException('You are not friends with this user');
		}

		await this.prisma.friendship.delete({ where: { id: friendship.id } });

		return { message: 'Friend removed successfully' };
	}

	/**
	 * Returns the list of accepted friends for the given user.
	 * Each entry includes username, displayName, and status (online/offline).
	 */
	async getFriends(userId: string): Promise<{ username: string; displayName: string | null; status: string }[]> {
		const friendships = await this.prisma.friendship.findMany({
			where: {
				OR: [
					{ requesterId: userId, status: 'ACCEPTED' },
					{ addresseeId: userId, status: 'ACCEPTED' },
				],
			},
			include: {
				requester: { 
					include: { 
						sessions: {
							where: { expiresAt: { gt: new Date() } },
							take: 1
						}
					}
				},
				addressee: { 
					include: { 
						sessions: {
							where: { expiresAt: { gt: new Date() } },
							take: 1
						}
					}
				},
			},
		});

		return friendships.map((f) => {
			const friend = f.requesterId === userId ? f.addressee : f.requester;
			const isOnline = friend.sessions.length > 0;
			return { 
				username: friend.username, 
				displayName: friend.displayName,
				status: isOnline ? 'online' : 'offline'
			};
		});
	}

	/**
	 * Returns the list of accepted friend usernames for the given user.
	 * Used internally (e.g. by cosmos) to check if two users are friends.
	 */
	async getFriendUsernames(userId: string): Promise<string[]> {
		const friends = await this.getFriends(userId);
		return friends.map((f) => f.username);
	}

	/**
	 * Checks whether two users are friends (both directions, status ACCEPTED).
	 */
	async areFriends(userIdA: string, userIdB: string): Promise<boolean> {
		const friendship = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ requesterId: userIdA, addresseeId: userIdB, status: 'ACCEPTED' },
					{ requesterId: userIdB, addresseeId: userIdA, status: 'ACCEPTED' },
				],
			},
		});
		return !!friendship;
	}

	/**
	 * Internal endpoint: given a userId and a list of creator usernames,
	 * returns which ones are friends with that user.
	 * Used by cosmos to filter star visibility.
	 */
	async filterFriendUsernames(userId: string, candidates: string[]): Promise<string[]> {
		if (!candidates.length) return [];

		// Get the IDs of the candidate users
		const candidateUsers = await this.prisma.user.findMany({
			where: { username: { in: candidates } },
			select: { id: true, username: true },
		});

		const candidateIds = candidateUsers.map((u) => u.id);

		const friendships = await this.prisma.friendship.findMany({
			where: {
				status: 'ACCEPTED',
				OR: [
					{ requesterId: userId, addresseeId: { in: candidateIds } },
					{ requesterId: { in: candidateIds }, addresseeId: userId },
				],
			},
			include: {
				requester: { select: { id: true, username: true } },
				addressee: { select: { id: true, username: true } },
			},
		});

		return friendships.map((f) => {
			const friend = f.requesterId === userId ? f.addressee : f.requester;
			return friend.username;
		});
	}
}
