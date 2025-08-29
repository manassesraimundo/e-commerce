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

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  async sinUp(body: AuthSinUpDto) {
    // Check user
    const user = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });
    if (user) throw new ConflictException();

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
    if (!user || !user.otpToken) throw new NotFoundException();

    const isvalid = await bcrypt.compare(otp, user.otpToken);
    if (!isvalid) throw new UnauthorizedException();

    if (!user.emailVerified) {
      await this.prismaService.user.update({
        where: { email },
        data: { emailVerified: true, otpToken: null },
      });
    }

    // Generet Token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    return { token };
  }

  async sinIn(body: AuthSinInDto) {}
}
