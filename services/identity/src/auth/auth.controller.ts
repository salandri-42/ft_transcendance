import {
	Controller,
	Post,
	Patch,
	Body,
	HttpCode,
	HttpStatus,
	UseGuards,
	Get,
	Request,
	Param,
	Headers,
	Ip,
	Query,
	Req,
	Res
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, TwoFaVerifyDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { FortyTwoAuthGuard } from '../forty-two/ft.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) { }

	@Throttle({
		default: {
			limit: 5,
			ttl: 60000
		}
	})
	@Post('register')
	async register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Get('verify-email')
	async verifyEmail(@Query('token') token: string, @Res() res: any) {
		const frontendUrl = process.env.FRONTEND_URL || 'https://orel.page';

		try {
			await this.authService.verifyEmail(token);
			return res.redirect(`${frontendUrl}?email_verified=success`);
		} catch {
			return res.redirect(`${frontendUrl}?email_verified=error`);
		}
	}

	@Get('42')
	@UseGuards(FortyTwoAuthGuard)
	async fortyTwoLogin(@Req() req: any) {

	}

	@Get('42/callback')
	@UseGuards(FortyTwoAuthGuard)
	async fortyTwoLoginCallback(@Req() req: any, @Res() res: any) {
		try {
			const user = await this.authService.fortyTwoLogin(req.user);
			res.redirect(
				`${process.env.FRONTEND_URL}/auth/callback?` +
				`access_token=${user.accessToken}&` +
				`refresh_token=${user.refreshToken}`
			)
		} catch (error: any) {
			const message = encodeURIComponent(error.response?.message || error.message || 'Authentication failed');
			res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=${message}`);
		}
	}

	@Throttle({
		default: {
			limit: 5,
			ttl: 60000
		}
	})
	@HttpCode(HttpStatus.OK)
	@Post('login')
	async login(
		@Body() loginDto: LoginDto,
		@Headers('user-agent') userAgent: string,
		@Ip() ip: string,
	) {
		return this.authService.login(loginDto, userAgent, ip);
	}

	@HttpCode(HttpStatus.OK)
	@Post('2fa/verify')
	async verify2fa(
		@Body() dto: TwoFaVerifyDto,
		@Headers('user-agent') userAgent: string,
		@Ip() ip: string,
	) {
		return this.authService.verifytwofa(dto.email, dto.code, userAgent, ip);
	}

	@HttpCode(HttpStatus.OK)
	@Post('refresh')
	async refresh(@Body() refreshDto: RefreshDto) {
		return this.authService.refresh(refreshDto.refresh_token);
	}

	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('logout')
	async logout(@Body() refreshDto: RefreshDto) {
		return this.authService.logout(refreshDto.refresh_token);
	}

	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('logout-all')
	async logoutAll(@Request() req: any) {
		return this.authService.logoutAll(req.user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@Get('sessions')
	async getSessions(@Request() req: any) {
		return this.authService.getSessions(req.user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	async getProfile(@Request() req: any) {
		return this.authService.getProfile(req.user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile/:userId')
	async getProfileById(@Param('userId') userId: string) {
		return this.authService.getProfileById(userId);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('profile')
	async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
		return this.authService.updateProfile(req.user.userId, dto);
	}

	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post('change-password')
	async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
		return this.authService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
	}
}
