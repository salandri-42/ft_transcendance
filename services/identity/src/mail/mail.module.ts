import { Module, Logger } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'
import { MailService } from './mail.service'

@Module({
	imports: [
		MailerModule.forRootAsync({
			useFactory: (config: ConfigService) => {
				const host = config.get<string>('MAIL_HOST', 'localhost');
				const port = config.get<number>('MAIL_PORT', 587);
				const user = config.get<string>('MAIL_USER');
				const pass = config.get<string>('MAIL_PASSWORD');

				const logger = new Logger('MailModule');
				logger.log(`Mail transport: ${host}:${port} (user: ${user ? user : 'none'})`);

				const useAuth = !!(user && pass);

				return {
					transport: {
						host,
						port: Number(port),
						secure: Number(port) === 465,
						...(Number(port) === 587 ? { requireTLS: true } : {}),
						...(useAuth ? { auth: { user, pass } } : {}),
					},
					defaults: {
						from: `"Orel notifications" <${config.get<string>('MAIL_FROM', user)}>`,
					},
				};
			},
			inject: [ConfigService]
		}),
	],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule { }