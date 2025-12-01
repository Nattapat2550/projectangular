// backend/src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  Profile,
  StrategyOptions,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const options: StrategyOptions = {
      clientID: config.get<string>('google.clientId') || '',
      clientSecret: config.get<string>('google.clientSecret') || '',
      callbackURL: config.get<string>('google.callbackUri') || '',
      scope: ['email', 'profile'],
    };

    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ) {
    const emails = profile.emails ?? [];
    const email = emails[0]?.value;
    const user = {
      googleId: profile.id,
      email,
      name: profile.displayName,
    };
    done(null, user);
  }
}
