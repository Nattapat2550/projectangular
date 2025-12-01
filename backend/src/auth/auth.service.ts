// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private async signToken(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    return this.jwtService.signAsync(payload);
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createLocalUser({
      email: dto.email,
      password: hash,
      name: dto.name,
    });
    const accessToken = await this.signToken(user.id, user.email, user.role);
    return { accessToken };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.signToken(user.id, user.email, user.role);
    return { accessToken };
  }

  async googleLogin(googleUser: {
    googleId: string;
    email?: string;
    name?: string;
  }) {
    if (!googleUser.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    let user = await this.usersService.findByGoogleId(googleUser.googleId);
    if (!user) {
      user = await this.usersService.findByEmail(googleUser.email);
      if (user) {
        user = await this.usersService.linkGoogleAccount(
          user.id,
          googleUser.googleId,
        );
      } else {
        user = await this.usersService.createGoogleUser({
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
        });
      }
    }
    const accessToken = await this.signToken(user.id, user.email, user.role);
    return { accessToken };
  }
}
