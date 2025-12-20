import { BadRequestException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AddToCartDto } from './dto/cart.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) { }

  async validateStock(data: AddToCartDto) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug: data.productSlug },
        select: { stock: true, isActive: true, name: true }
      });

      if (!product || !product.isActive) {
        throw new NotFoundException('');
      }

      if (product.stock < data.quantity) {
        throw new BadRequestException(
          `Desculpe, temos apenas ${product.stock} unidades de ${product.name} em estoque.`
        );
      }

      return {
        message: 'Item disponível e validado.',
        available: true
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error fetching products.');
    }
  }
}
