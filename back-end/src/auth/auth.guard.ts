import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromCookie(request);

    if (!token) throw new UnauthorizedException('No access token found.');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        algorithms: ['HS256'],
        secret: process.env.JWT_SICRET,
      });
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return true;
  }

  private extractTokenFromCookie(req: Request): string | undefined {
    const token = req.cookies?.access_token;
    return token ? token : undefined;
  }
}
