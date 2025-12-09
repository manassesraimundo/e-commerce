import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
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

  /**
   * Sign up a new user, hash password, generate OTP and save to database
   * @param body AuthSignUpDto
   * @returns Success message
   */
  async signUp(body: AuthSinUpDto) {
    try {
      // Check user
      const user = await this.checkUserByEmail(body.email);
      if (user) throw new ConflictException('Duplication conflict');

      // Passwod Hash
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(body.password, salt);

      // generet OTP
      const otp = await this.generetedOtp();

      // Create a new user
      const newUser = await this.prismaService.user.create({
        data: {
          name: body.name,
          email: body.email,
          password_hash: passwordHash,
          role: body.role ?? UserRole.CUSTOMER,
          otpVerify: otp.otpHash,
          otpExpiresAt: otp.otpExpiresAt,
        },
      });

      // Send E-mail to user
      this.emailService.sendEmail(
        `Seu codigo para verificar a sua conta ${otp.code}`,
      );

      return { message: 'Check your e-mail to access the verification code.' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  /**
   * Verify user's OTP and activate account
   * @param email User email
   * @param otp OTP code
   * @returns Auth token
   */
  async verifyOtp(email: string, otp: string) {
    try {
      const user = await this.checkUserByEmail(email);
      if (!user || !user.otpVerify)
        throw new NotFoundException('User or verification code not found.');

      // Verifica se o OTP expirou
      if (!user.otpExpiresAt || user.otpExpiresAt < new Date())
        throw new UnauthorizedException('Verification code expired.');

      const isvalid = await bcrypt.compare(otp, user.otpVerify);
      if (!isvalid) throw new UnauthorizedException();

      if (!user.emailVerified) {
        await this.prismaService.user.update({
          where: { email },
          data: {
            emailVerified: true,
            otpVerify: null,
            otpExpiresAt: null,
            lastLogin: new Date(),
          },
        });
      } else if (user.emailVerified && user.otpVerify) {
        await this.prismaService.user.update({
          where: { email },
          data: {
            emailVerified: true,
            otpVerify: null,
            otpExpiresAt: null,
            lastLogin: new Date(),
          },
        });
      }

      // Generet Token
      const token = await this.generetedToken(user.id, user.email, user.role);

      return token;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error verifying OTP.');
    }
  }

  /**
   * Resend a new OTP to the user
   * @param email User email
   * @returns Confirmation message
   */
  async sendNewOtp(email: string) {
    try {
      const user = await this.checkUserByEmail(email);
      if (!user) throw new NotFoundException('User not found.');

      const otp = await this.generetedOtp();

      await this.prismaService.user.update({
        where: { email },
        data: { otpVerify: otp.otpHash, otpExpiresAt: otp.otpExpiresAt },
      });

      this.emailService.sendEmail(`Novo Opt ${otp.code}.`);

      return {
        message: 'A new verification code has been sent to your email.',
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error sending new OTP.');
    }
  }

  /**
   * Sign in user with email and password
   * @param body AuthSignInDto
   * @returns JWT token
   */
  async signIn(body: AuthSinInDto) {
    try {
      const user = await this.checkUserByEmail(body.email);
      if (!user) throw new NotFoundException('User not found.');

      if (!user.emailVerified) {
        if (user.otpVerify) {
          // aqui você pode lançar um erro customizado dizendo para verificar o email
          throw new UnauthorizedException(
            'Please verify your email before signing in. Check your inbox.',
          );
        } else {
          const otp = await this.generetedOtp();

          await this.prismaService.user.update({
            where: { email: body.email },
            data: { otpVerify: otp.otpHash, otpExpiresAt: otp.otpExpiresAt },
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
      if (!isPasswordValid)
        throw new UnauthorizedException('Invalid credentials.');

      await this.prismaService.user.update({
        where: { email: user.email },
        data: { lastLogin: new Date() },
      });
      const token = await this.generetedToken(user.id, user.email, user.role);

      return token;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error signing in.');
    }
  }

  /**
   * Generate a reset password link and send via email
   * @param email string
   * @returns message confirmation
   */
  async requestPasswordReset(email: string) {
    try {
      const user = await this.checkUserByEmail(email);
      if (!user) throw new NotFoundException('User not found.');

      // Gerar o JWT temporario
      const payload = {
        sub: user.id,
        email: user.email,
        action: 'reset_password',
      };
      const token = await this.jwtService.signAsync(payload, {
        algorithm: 'HS256',
        expiresIn: '15m',
      });

      const resetLink = `https://localhost:3000/reset-password?token=${token}`;

      // Enviar email
      this.emailService.sendEmail(resetLink);

      return { message: 'Check your e-mail to reset your password.' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error requesting password reset.');
    }
  }

  /**
   * Reset user password with a valid reset token
   * @param token string
   * @param newPassword string
   * @returns success message
   */
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
        where: { email: payload.email },
        data: { password_hash: passwordHash },
      });
      return { message: 'Password updated successfully' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new UnauthorizedException('Invalid or expired reset token.');
    }
  }

  /**
   * Generate a 6-digit OTP code, hash it, and set its expiration time
   * @returns Object containing the plain OTP (for sending), its hash, and expiration date
   */
  private async generetedOtp() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(code, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return { otpHash, otpExpiresAt, code };
  }

  /**
   * Generate JWT token
   * @param userId - User unique identifier (UUID)
   * @param email - User email
   * @param role - User role
   * @returns Object containing signed JWT
   */
  private async generetedToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email: email, role: role };
    const token = await this.jwtService.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    return token;
  }

  /**
   * Check user
   * @param email
   * @returns user
   */
  private async checkUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) return null;

    return user;
  }
}
