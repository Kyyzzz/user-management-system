import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private getAccessTokenExpiresIn(): number | StringValue {
    const raw = this.configService.get<string>('JWT_EXPIRATION') ?? '24h';
    return /^\d+$/.test(raw) ? Number(raw) : (raw as StringValue);
  }

  private getRefreshTokenSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'your_jwt_secret_key'
    );
  }

  private getRefreshTokenExpiresIn(): number | StringValue {
    const raw = this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';
    return /^\d+$/.test(raw) ? Number(raw) : (raw as StringValue);
  }

  private signAccessToken(user: { id: number; email: string; role: UserRole }): string {
    const payload = { email: user.email, sub: user.id, role: user.role };
    // Uses AuthModule JwtModule config (JWT_SECRET + JWT_EXPIRATION)
    return this.jwtService.sign(payload, { expiresIn: this.getAccessTokenExpiresIn() });
  }

  private signRefreshToken(user: { id: number }): string {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: this.getRefreshTokenExpiresIn(),
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = this.signAccessToken(user);
    const refresh_token = this.signRefreshToken(user);
    await this.usersService.setRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refresh(refresh_token: string) {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(refresh_token, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId: number | undefined = decoded?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userWithRt = await this.usersService.findOneWithRefreshToken(userId);
    if (!userWithRt || !userWithRt.hashedRefreshToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const rtMatches = await bcrypt.compare(
      refresh_token,
      userWithRt.hashedRefreshToken,
    );
    if (!rtMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate refresh token on every refresh
    const new_access_token = this.signAccessToken(userWithRt);
    const new_refresh_token = this.signRefreshToken(userWithRt);
    await this.usersService.setRefreshToken(userWithRt.id, new_refresh_token);

    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token,
    };
  }

  async logout(userId: number) {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Logged out' };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create user with 'user' role only
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.USER, // Force user role for registration
    });

    // Return user data without password
    const { password, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
