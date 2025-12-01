// backend/src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    } as any); // cast เป็น any กันเรื่อง StrategyOptions ไปเลย
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any, // ไม่ใช้ Profile ตรงนี้
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, emails, displayName } = profile;

    const user = {
      provider: 'google',
      providerId: id,
      email: emails?.[0]?.value,
      name: displayName,
    };

    done(null, user);
  }
}
