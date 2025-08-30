import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthSinUpDto, AuthSinInDto, UserRole } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async sinUp(body: AuthSinUpDto) {
    // Check user
    const user = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });
    if (user) throw new ConflictException('Duplication conflict');

    // Passwod Hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(body.password, salt);

    // generet OTP Token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(code, 10);

    // Create a new user
    const newUser = await this.prismaService.user.create({
      data: {
        name: body.name,
        email: body.email,
        password_hash: passwordHash,
        role: body.role ?? UserRole.CUSTOMER,
        otpToken: otpHash,
      },
    });

    // Send E-mail to user

    return { message: 'Check your e-mail to access the verification code.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user || !user.otpToken) throw new NotFoundException('User or verification code not found.');

    const isvalid = await bcrypt.compare(otp, user.otpToken);
    if (!isvalid) throw new UnauthorizedException();

    if (!user.emailVerified) {
      await this.prismaService.user.update({
        where: { email },
        data: { emailVerified: true, otpToken: null },
      });
    }

    // Generet Token
    const token = await this.generetedToken(user.id, user.email, user.role);

    return { token };
  }

  async sinIn(body: AuthSinInDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });
    if (!user) throw new NotFoundException('User not found.');

    if (!user.emailVerified) {
      if (user.otpToken) {
        // aqui você pode lançar um erro customizado dizendo para verificar o email
        throw new UnauthorizedException(
          'Please verify your email before signing in. Check your inbox.',
        );
      } else {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(code, 10);

        await this.prismaService.user.update({
          where: { email: body.email },
          data: { otpToken: otpHash },
        });

        // Aqui você chamaria o serviço de email para reenviar o código

        throw new UnauthorizedException(
          'Your email is not verified. We have sent a new verification code.',
        );
      }
    }
    const isPasswordValid = await bcrypt.compare(
      body.password,
      user?.password_hash,
    );
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials.');

    const token = await this.generetedToken(user.id, user.email, user.role);

    return { token };
  }
  async requestPasswordReset(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('User not found.');

    // Gerar o JWT temporario
    const payload = { sub: user.id, email: user.email, action: 'reset_password' };
    const token = await this.jwtService.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    const resetLink = `https://localhost:3000/reset-password?token=${token}`;

    // Enviar email

    return { message: 'Check your e-mail to reset your password.' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        algorithms: ['HS256'],
      });

      if (payload.action !== 'reset_password')
        throw new UnauthorizedException('Invalid reset token');

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await this.prismaService.user.update({
        where: { id: payload.sub },
        data: { password_hash: passwordHash },
      });
      return { message: 'Password updated successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  private async generetedToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email: email, role: role };
    const token = await this.jwtService.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    return { token };
  }
}
