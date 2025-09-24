import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: { sub: number; iat: number; exp: number }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: { id: true, email: true, createdAt: true, updatedAt: true },
    });
    return user;
  }
}
