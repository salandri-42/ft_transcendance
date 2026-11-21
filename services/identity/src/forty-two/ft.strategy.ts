import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

const FortyTwoStrategy42 = require('passport-42').Strategy;

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(FortyTwoStrategy42, '42') {
  constructor() {
	super({
	  clientID: process.env.FT_ID,
	  clientSecret: process.env.FT_SECRET,
	  callbackURL: process.env.FT_CALLBACK_URL,
	});
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
	const { id, username, displayName } = profile;
	const user = {
	  id,
	  username,
	  displayName,
	};
	done(null, user);
  }
}
