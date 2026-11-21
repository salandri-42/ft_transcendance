import {
	Injectable,
	UnauthorizedException,
	ConflictException,
	NotFoundException,
	Logger,
	BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		private mailService: MailService,
	) { }

	private async verifyLegacyEmailToken(token: string) {
		const user = await this.prisma.user.findFirst({
			where: { emailToken: token },
		});

		if (!user) {
			throw new BadRequestException('Invalid token');
		}

		if (user.emailTokenExpiry && user.emailTokenExpiry < new Date()) {
			throw new BadRequestException('Link expired');
		}

		if (user.isEmailVerified) {
			return { message: 'Email already verified' };
		}

		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				isEmailVerified: true,
				emailToken: null,
				emailTokenExpiry: null,
			},
		});

		return { message: 'Email verified succesfully' };
	}

	async register(data: RegisterDto) {
		this.logger.log(`Registering user: ${data.email}`);
		const existingUser = await this.prisma.user.findFirst({
			where: {
				OR: [{ email: data.email }, { username: data.username }],
			},
		});
		this.logger.debug('Existing user check complete');

		if (existingUser) {
			return { error: 'Email or Username already exists' };
		}

		this.logger.debug('Hashing password...');
		const hashedPassword = await bcrypt.hash(data.password, 10);
		this.logger.debug('Password hashed');

		const user = await this.prisma.user.create({
			data: {
				email: data.email,
				username: data.username,
				password: hashedPassword,
				isEmailVerified: true, // Désactivé pour test local
				emailToken: null,
				emailTokenExpiry: null,
			},
		});
		this.logger.log(`User created in DB: ${user.id}`);
		console.log(`[IDENTITY LOG] Un user est créé : ${user.username} (${user.email})`);

		const emailToken = this.jwtService.sign(
			{
				sub: user.id,
				type: 'email_verify',
				nonce: randomBytes(16).toString('hex'),
			},
			{ expiresIn: '15m' },
		);

		try {
			await this.mailService.sender(user.email, emailToken);
		} catch (error) {
			this.logger.error(`Failed to send verification email to ${user.email}`, error.stack);
		}
		return { message: 'User created. Please check your email to verify your account.', userId: user.id };
	}
	
	async fortyTwoLogin(profile: any) {
		const { id, username, displayName } = profile;
		const email = profile.email || `${profile.username}@student.42antananarivo.mg`;

		// 1. Chercher si l'utilisateur est déjà lié via son ftId
		let user = await this.prisma.user.findFirst({
			where: { ftId: id },
		});
		
		if (!user) {
			// 2. Vérifier s'il existe un compte avec le même email ou username
			const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
			const existingByUsername = await this.prisma.user.findUnique({ where: { username } });

			if (existingByEmail) {
				// SCÉNARIO 1 : Même email -> Liaison automatique
				user = await this.prisma.user.update({
					where: { id: existingByEmail.id },
					data: { ftId: id, isEmailVerified: true }
				});
			} else if (existingByUsername) {
				// SCÉNARIO 2 : Même pseudo mais email différent -> Conflit
				throw new ConflictException(
					`Le pseudonyme "${username}" est déjà utilisé par un compte avec un email différent.`
				);
			} else {
				// SCÉNARIO 3 : Création d'un nouveau compte
				user = await this.prisma.user.create({
					data: {
						email: email,
						ftId: id,
						username: username,
						displayName: displayName,
						isEmailVerified: true,
						password: null,
					}
				});
				console.log(`[IDENTITY LOG] Un user est créé via 42 OAuth : ${user.username} (${user.email})`);
			}
		}

		const payload = { sub: user.id, username: user.username };
		const session = await this.createSession(user.id);

		return { 
			accessToken: this.jwtService.sign(payload), 
			refreshToken: session.refreshToken 
		};
	}

	async verifyEmail(token: string) {
		let payload: { sub?: string; type?: string };
		try {
			payload = this.jwtService.verify(token) as { sub?: string; type?: string };
		} catch {
			return this.verifyLegacyEmailToken(token);
		}

		if (payload.type !== 'email_verify' || !payload.sub) {
			throw new BadRequestException('Invalid token');
		}

		const user = await this.prisma.user.findUnique({
			where: { id: payload.sub },
		});

		if (!user) {
			throw new BadRequestException('Invalid token');
		}

		if (user.isEmailVerified) {
			return { message: 'Email already verified' };
		}

		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				isEmailVerified: true,
				emailToken: null,
				emailTokenExpiry: null,
			}
		})
		return { message: 'Email verified succesfully' }
	}

	async verifytwofa(email: string, code: string, userAgent?: string, ipAddress?: string) {
		const user = await this.prisma.user.findUnique({ where: { email } });
		if (!user?.twoFaCode || !user.twoFaTime || user.twoFaTime < new Date()) {
			throw new UnauthorizedException('No valid 2FA code found or code expired');
		}
		const isValid = await bcrypt.compare(code, user.twoFaCode);
		if (!isValid) {
			throw new UnauthorizedException('Invalid 2FA code');
		}
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				twoFaCode: null,
				twoFaTime: null,
			},
		});
		const session = await this.createSession(user.id, userAgent, ipAddress);
		const payload = { sub: user.id, username: user.username };
		return {
			access_token: this.jwtService.sign(payload),
			refresh_token: session.refreshToken,
		};
	}

	async login(data: LoginDto, userAgent?: string, ipAddress?: string) {
		this.logger.log(`Login attempt: ${data.email}`);
		const user = await this.prisma.user.findUnique({
			where: { email: data.email },
		});
		this.logger.debug(`User found: ${!!user}`);

		if (!user || !user.password) {
			return { error: 'Invalid credentials' };
		}

		const isPasswordValid = await bcrypt.compare(
			data.password,
			user.password,
		);

		if (!isPasswordValid) {
			return { error: 'Invalid credentials' };
		}

		if (!user.isEmailVerified)
			throw new UnauthorizedException('Please verify your email before you can continue')

		if (user.twoFaOn) {
			const code = Math.floor(100000 + Math.random() * 900000).toString();
			const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
			const hashedCode = await bcrypt.hash(code, 10);

			await this.prisma.user.update({
				where: { id: user.id },
				data: {
					twoFaCode: hashedCode,
					twoFaTime: expiresAt,
				},
			});
			await this.mailService.sendTwoFaCode(user.email, code);
			this.logger.log(`2FA code sent to ${user.email}`);
			return { requires2fa: true };
		}

		const session = await this.createSession(user.id, userAgent, ipAddress);
		const payload = { sub: user.id, username: user.username };
		console.log(`[IDENTITY LOG] Un user se connecte : ${user.username}`);
		return {
			access_token: this.jwtService.sign(payload),
			refresh_token: session.refreshToken,
		};
	}

	async createSession(
		userId: string,
		userAgent?: string,
		ipAddress?: string,
	) {
		const refreshToken = randomBytes(64).toString('hex');
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		const session = await this.prisma.session.create({
			data: {
				userId,
				refreshToken,
				userAgent,
				ipAddress,
				expiresAt,
			},
		});

		return session;
	}

	async refresh(refreshToken: string) {
		const session = await this.prisma.session.findUnique({
			where: { refreshToken },
			include: { user: true },
		});

		if (!session || session.expiresAt < new Date()) {
			if (session) {
				await this.prisma.session.delete({
					where: { id: session.id },
				});
			}
			throw new UnauthorizedException('Invalid or expired refresh token');
		}

		const payload = {
			sub: session.user.id,
			username: session.user.username,
		};

		return {
			access_token: this.jwtService.sign(payload),
		};
	}

	async logout(refreshToken: string) {
		const session = await this.prisma.session.findUnique({
			where: { refreshToken },
			include: { user: true },
		});

		if (session) {
			console.log(`[IDENTITY LOG] Un user se déconnecte : ${session.user.username}`);
			await this.prisma.session.delete({
				where: { id: session.id },
			});
		}

		return { message: 'Logged out successfully' };
	}

	async logoutAll(userId: string) {
		await this.prisma.session.deleteMany({
			where: { userId },
		});

		return { message: 'All sessions logged out successfully' };
	}

	async getSessions(userId: string) {
		const sessions = await this.prisma.session.findMany({
			where: { userId },
			select: {
				id: true,
				userAgent: true,
				ipAddress: true,
				createdAt: true,
				expiresAt: true,
			},
		});

		return sessions;
	}

	async getProfile(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				username: true,
				displayName: true,
				avatarUrl: true,
				createdAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user;
	}

	async getProfileById(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				username: true,
				displayName: true,
				avatarUrl: true,
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user;
	}

	async updateProfile(userId: string, data: { username?: string; displayName?: string; avatarUrl?: string }) {
		// Check username uniqueness if changing
		if (data.username) {
			const existing = await this.prisma.user.findFirst({
				where: { username: data.username, NOT: { id: userId } },
			});
			if (existing) {
				return { error: 'Username already taken' };
			}
		}

		const updateData: any = {};
		if (data.username) updateData.username = data.username;
		if (data.displayName !== undefined) updateData.displayName = data.displayName;
		if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

		try {
			const user = await this.prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				email: true,
				username: true,
				displayName: true,
				avatarUrl: true,
				createdAt: true,
			},
			});

			return user;
		} catch (error: any) {
			if (error.code === 'P2025') {
				throw new UnauthorizedException('User not found in database. Please login again.');
			}
			throw error;
		}
	}

	async changePassword(userId: string, currentPassword: string, newPassword: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) return { error: 'User not found' };

		// If user has a password (not OAuth-only), verify it
		if (user.password) {
			const valid = await bcrypt.compare(currentPassword, user.password);
			if (!valid) {
				return { error: 'Current password is incorrect' };
			}
		}

		const hashed = await bcrypt.hash(newPassword, 10);

		await this.prisma.user.update({
			where: { id: userId },
			data: { password: hashed },
		});

		return { message: 'Password updated successfully' };
	}
}
