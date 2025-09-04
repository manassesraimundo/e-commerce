import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSinUpDto } from './dto/auth-sinUp.dto';
import type { Response } from 'express';
import { AuthSinInDto } from './dto/auth-sinIn.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sing-up')
  async singUp(@Body() body: AuthSinUpDto) {
    const message = await this.authService.signUp(body);
    return message;
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: { email: string; otp: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.verifyOtp(body.email, body.otp);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60,
    });

    return { token };
  }

  @Post('new-opt')
  @HttpCode(HttpStatus.OK)
  async sendNewOtp(@Body() { email }: { email: string }) {
    const message = await this.authService.sendNewOtp(email);
    return message;
  }

  @Post('sing-in')
  @HttpCode(HttpStatus.OK)
  async singIn(
    @Body() body: AuthSinInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.signIn(body);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60,
    });

    return { token };
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() { email }: { email: string }) {
    const message = await this.authService.requestPasswordReset(email);
    return message;
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() { token, password }: { token: string; password: string },
  ) {
    const message = await this.authService.resetPassword(token, password);
    return message;
  }

  @Post('long-out')
  @HttpCode(HttpStatus.OK)
  longOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Long-out sucesse' };
  }
}
