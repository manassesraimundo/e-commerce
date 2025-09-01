import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AddressUpdateDto } from './dto/address-update.dto';

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

  async updateAddressUser(
    userID: string,
    body: AddressUpdateDto,
    addressID: string,
  ) {
    try {
      const address = await this.prismaService.address.findUnique({
        where: { id: addressID },
      });
      if (!address) throw new NotFoundException('Address not found.');

      if (address.userId !== userID) {
        throw new UnauthorizedException(
          'You are not allowed to update this address.',
        );
      }
      await this.prismaService.address.update({
        where: { id: addressID },
        data: {
          city: body.city,
          state: body.state,
          street: body.street,
          complement: body.complement,
          number: body.number,
          neighborhood: body.neighborhood,
          postalCode: body.postalCode,
          isDefault: body.isDefault,
          country: body.country,
        },
      });

      return { message: 'Address updated successfully.' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error updating address.');
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

  async deleteAccountUser(userID: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userID },
      });
      if (!user) throw new NotFoundException('User not found.');

      await this.prismaService.user.delete({
        where: { id: userID },
      });
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error deleting account.');
    }
  }
}
