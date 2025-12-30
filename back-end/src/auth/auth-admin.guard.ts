import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthAdminGuard implements CanActivate {
  constructor(
    private readonly jwtServise: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const toke = request.cookies.access_token || undefined;

    if (!toke) throw new UnauthorizedException();
    try {
      const payload = await this.jwtServise.verifyAsync(toke, {
        algorithms: ['HS256'],
        secret: process.env.JWT_SICRET,
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new NotFoundException();

      if (user.role != 'ADMIN') throw new UnauthorizedException();
    } catch (error) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
