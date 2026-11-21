import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { FortyTwoStrategy } from '../forty-two/ft.strategy';

@Module({
	imports: [
		PrismaModule,
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'secret',
			signOptions: { expiresIn: '1d' },
		}),
		MailModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, FortyTwoStrategy],
	exports: [AuthService],

})
export class AuthModule { }
