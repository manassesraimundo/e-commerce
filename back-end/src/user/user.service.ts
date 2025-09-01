import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUser(userID: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userID },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          addresses: {
            omit: {
              updatedAt: true,
              createdAt: true,
            },
          },
        },
      });
      if (!user) throw new NotFoundException('User not found.');

      return user;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error fetching user.');
    }
  }

  async updatePasswordUser(userID: string, password: string) {
    if (password.length < 8)
      throw new BadRequestException(
        'Password must be at least 8 characters long.',
      );
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await this.prismaService.user.update({
        where: { id: userID },
        data: { password_hash: passwordHash },
      });

      return { message: 'Password updated successfully.' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error updating password.');
    }
  }
}
