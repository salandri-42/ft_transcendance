import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);

	constructor(
		private readonly mailerService: MailerService,
		private readonly config: ConfigService,
	) { }

	private emailWrapper(content: string): string {
		return `
			<div style="margin:0; padding:32px 16px; background:#0a0a0f; font-family:'Inter', Arial, Helvetica, sans-serif; color:rgba(255,255,255,0.9);">
				<div style="max-width:620px; margin:0 auto; background:#0f0f1a; border:1px solid rgba(255,215,0,0.15); border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(255,215,0,0.04); overflow:hidden;">
					<div style="padding:30px 28px;">${content}</div>
				</div>
			</div>
		`;
	}
	private mainTemplate(data: {
		title1: string;
		title2: string;
		actionHtml: string;
		note: string;
	}): string {
		return this.emailWrapper(`
			<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="preload" as="image" href="images/cd43797fe74b86462a3ff63ebdb16a83.png"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="format-detection" content="telephone=no, date=no, address=no, email=no"><meta name="x-apple-disable-message-reformatting"><meta name="keywords" content="DAHGZZWs7yQ, BAGb_JvXhGo"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet"><!--[if mso]><div>
				<noscript>
					<xml>
						<o:OfficeDocumentSettings>
						<o:AllowPNG/>
						<o:PixelsPerInch>96</o:PixelsPerInch>
						</o:OfficeDocumentSettings>
					</xml>
				</noscript></div><![endif]--><!--[if !mso]><!--><style>@media (max-width: 450px) {
					.layout-0 {
						display: none !important;
					}
				}
				@media (max-width: 450px) and (min-width: 0px) {
					.layout-0-under-450 {
						display: table !important;
					}
				}</style><!--<![endif]--></head><body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#050508;margin:0;padding:0"><table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#050508" style="background-color:#050508"><tbody><tr><td style="background-color:#050508"><!--[if mso]><center>
						<table align="center" border="0" cellpadding="0" cellspacing="0" width="600">
						<tbody>
							<tr>
							<td><![endif]--><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;min-height:600px;margin:0 auto;background-color:#0f0f1a"><tbody><tr><td style="vertical-align:top"></td></tr><tr><td style="vertical-align:top;padding:10px
			0px
			10px
			0px"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr><td style="padding:10px 0 10px 0;vertical-align:top"><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:rgba(255,255,255,0.95);font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:'Inter', Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word;color:rgba(255,255,255,0.85)"><tbody><tr><td dir="ltr" style="font-size:13.3334px;letter-spacing:-0.09em;white-space:pre-wrap;line-height:0.65;text-align:left;padding:0px 20px;mso-line-height-alt:1px"><br></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td dir="ltr" style="font-size:55.9997px;letter-spacing:-0.09em;font-family:'Space Grotesk', Helvetica, Arial, sans-serif;white-space:pre-wrap;line-height:0.65;text-align:left;padding:0px 20px;mso-line-height-alt:1px;color:#FFD700">${data.title1}<br></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td dir="ltr" style="font-size:55.9997px;letter-spacing:-0.09em;font-family:'Space Grotesk', Helvetica, Arial, sans-serif;white-space:pre-wrap;line-height:0.65;text-align:left;padding:0px 20px;mso-line-height-alt:1px;color:#FFD700">${data.title2}<br></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td style="padding:0px 20px"><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px"><tbody><tr><td style="width:100%;padding:0"><img src="https://_l-gowgobz2nutelnadez7gzl6--92gby_8pn8fuw_8.canva-cdn.email/cd43797fe74b86462a3ff63ebdb16a83.png" width="560" height="252" style="display:block;width:100%;height:auto;max-width:100%"></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td style="padding:0px 20px"><table cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:220px"><tbody><tr><td style="width:100%;padding:20 0"><table cellpadding="0" cellspacing="0" style="width:100%;border-spacing:0;border-collapse:separate"><tbody><tr><td valign="middle" height="66" style="height:66px;vertical-align:middle;box-sizing:border-box;background-color:#1a1400;border-top-left-radius:5.513784074164837px;border-top-right-radius:5.513784074164837px;border-bottom-left-radius:5.513784074164837px;border-bottom-right-radius:5.513784074164837px">
				${data.actionHtml}
			</td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td><table border="0" cellpadding="0" cellspacing="0" class="layout-0" align="center" style="display:table;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto"><tbody><tr><td style="text-align:center;padding:22px 20px"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:560px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="100.00%" style="width:100.00%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:rgba(255,255,255,0.95);font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:'Inter', Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word;color:rgba(255,255,255,0.85)"><tbody><tr><td dir="ltr" style="font-size:14.6667px;letter-spacing:-0.015em;line-height:1.38;text-align:center"><span style="font-weight:700;white-space:pre-wrap">Note:</span><span style="white-space:pre-wrap"> ${data.note} </span><span style="white-space:pre-wrap"><br></span></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td dir="ltr" style="font-size:14.6667px;letter-spacing:-0.015em;white-space:pre-wrap;line-height:1.38;text-align:center">Best, <br></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td dir="ltr" style="font-size:14.6667px;letter-spacing:-0.015em;white-space:pre-wrap;line-height:1.38;text-align:center">The Team<br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--[if !mso]><!--><table border="0" cellpadding="0" cellspacing="0" class="layout-0-under-450" align="center" style="display:none;border-spacing:0px;border-collapse:separate;width:100%;max-width:100%;table-layout:fixed;margin:0 auto"><tbody><tr><td style="text-align:center;padding:22px 20px"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;max-width:450px;table-layout:fixed;margin:0 auto"><tbody><tr><td width="100.00%" style="width:100.00%;box-sizing:border-box;vertical-align:top"><table border="0" cellpadding="0" cellspacing="0" style="border-spacing:0px;border-collapse:separate;width:100%;table-layout:fixed"><tbody><tr><td><table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="color:rgba(255,255,255,0.95);font-style:normal;font-weight:normal;font-size:16px;line-height:1.4;letter-spacing:0;text-align:left;direction:ltr;border-collapse:collapse;font-family:'Inter', Arial, Helvetica, sans-serif;white-space:normal;word-wrap:break-word;word-break:break-word;color:rgba(255,255,255,0.85)"><tbody><tr><td dir="ltr" style="font-size:14.6667px;letter-spacing:-0.015em;line-height:1.38;text-align:center"><span style="font-weight:700;white-space:pre-wrap">Note:</span><span style="white-space:pre-wrap"> ${data.note} </span><span style="white-space:pre-wrap"><br></span></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td dir="ltr" style="font-size:14.6667px;letter-spacing:-0.015em;white-space:pre-wrap;line-height:1.38;text-align:center">Best, <br></td></tr><tr><td style="font-size:0;height:16px" height="16">&nbsp;</td></tr><tr><td dir="ltr" style="font-size:14.6667px;letter-spacing:-0.015em;white-space:pre-wrap;line-height:1.38;text-align:center">The Team<br></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><!--<![endif]--></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td height="100%" style="height:100%;font-size:0;line-height:0" aria-hidden="true">&nbsp;</td></tr></tbody></table><!--[if mso]></td>
					</tr>
				</tbody>
				</table>
			</center><![endif]--></td></tr></tbody></table></body></html>
		`)
	}

	async sender(email: string, token: string): Promise<void> {
		const baseUrl = this.config.get<string>('APP_URL', 'https://localhost:8443');
		const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

		const actionHtml = `
			<a href="${verifyUrl}" ses:no-track="" target="_blank" rel="noopener" style="text-decoration:none;display:block">
				<table cellpadding="0" cellspacing="0" style="width:100%;height:100%;border-spacing:0;border-collapse:collapse">
					<tbody><tr><td style="color:#FFD700;font-size:14.6668px;font-weight:bold;font-family:'Inter', Arial, Helvetica, sans-serif;font-style:normal;text-decoration:none;direction:ltr;text-align:center;line-height:1.4em;letter-spacing:0em;vertical-align:middle;box-sizing:border-box">
						<span style="color:#FFD700;mso-style-textfill-type:solid;mso-style-textfill-fill-color:#FFD700">Verify email</span>
					</td></tr></tbody>
				</table>
			</a>`;

		this.logger.log(`Sending verification email to ${email}`);

		try {
			await this.mailerService.sendMail({
				to: email,
				subject: 'Verify your email',
				html: this.mainTemplate({
					title1: 'Welcome',
					title2: 'Verify your email',
					actionHtml,
					note: 'This link is valid for 15 minutes only. <br>If you did not initiate this request, no further action is required.'
				}),
			});
			this.logger.log(`Verification email sent to ${email}`);
		} catch (error) {
			this.logger.error(`Failed to send verification email to ${email}`, error.stack);
			throw error;
		}
	}

	async sendTwoFaCode(email: string, code: string): Promise<void> {
		const actionHtml = `
			<div style="text-decoration:none;display:block">
				<table cellpadding="0" cellspacing="0" style="width:100%;height:100%;border-spacing:0;border-collapse:collapse">
					<tbody><tr><td style="color:#FFD700;font-size:24px;font-weight:bold;font-family:'Inter', Arial, Helvetica, sans-serif;font-style:normal;text-decoration:none;direction:ltr;text-align:center;line-height:1.4em;letter-spacing:0.3em;vertical-align:middle;box-sizing:border-box">
						<span style="color:#FFD700;mso-style-textfill-type:solid;mso-style-textfill-fill-color:#FFD700">${code}</span>
					</td></tr></tbody>
				</table>
			</div>`;

		this.logger.log(`Sending 2FA code to ${email}`);
		try {
			await this.mailerService.sendMail({
				to: email,
				subject: 'Your 2FA Code',
				html: this.mainTemplate({
					title1: 'Security',
					title2: 'Your 2FA Code',
					actionHtml,
					note: 'This code is valid for 15 minutes only. <br>If you did not initiate this request, please secure your account.'
				}),
			});
			this.logger.log(`2FA code sent to ${email}`);
		} catch (error) {
			this.logger.error(`Failed to send 2FA code to ${email}`, error.stack);
			throw error;
		}
	}
}
