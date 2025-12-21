import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AddToCartDto } from './dto/cart.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  async validateStock(data: AddToCartDto) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug: data.productSlug },
        select: { stock: true, isActive: true, name: true },
      });

      if (!product || !product.isActive) {
        throw new NotFoundException('');
      }

      if (product.stock < data.quantity) {
        throw new BadRequestException(
          `Desculpe, temos apenas ${product.stock} unidades de ${product.name} em estoque.`,
        );
      }

      return {
        message: 'Item disponível e validado.',
        available: true,
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException();
    }
  }

  async getCart(userId: string) {
    try {
      const cart = await this.prismaService.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart) return { items: [], subtotal: 0, totalItems: 0 };

      const subtotal = cart.items.reduce((acc, item) => {
        return acc + Number(item.product.newPrice) * item.quantity;
      }, 0);

      const totalItems = cart.items.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );

      return {
        cartId: cart.id,
        items: cart.items,
        subtotal,
        totalItems,
      };
    } catch (error) {
      console.error(error);
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException();
    }
  }

  async addItemToCart(userId: string, data: AddToCartDto) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug: data.productSlug },
      });

      if (!product || !product.isActive) {
        throw new NotFoundException();
      }

      if (product.stock < data.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${product.stock}`,
        );
      }

      const cart = await this.prismaService.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      return await this.prismaService.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: product.id,
          },
        },
        update: {
          quantity: { increment: data.quantity },
        },
        create: {
          cartId: cart.id,
          productId: product.id,
          quantity: data.quantity,
        },
      });
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException();
    }
  }

  async removeItem(userId: string, productId: string) {
    try {
      const cart = await this.prismaService.cart.findUnique({
        where: { userId },
      });

      if (!cart) throw new NotFoundException('Carrinho não encontrado.');

      await this.prismaService.cartItem.delete({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: productId,
          },
        },
      });

      return { message: 'Item removido do carrinho.' };
    } catch (error) {
      throw new NotFoundException('O item não existe no carrinho.');
    }
  }

  async clearCart(userId: string) {
    try {
      const cart = await this.prismaService.cart.findUnique({
        where: { userId },
      });

      if (!cart) throw new NotFoundException('Carrinho não encontrado.');

      await this.prismaService.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return { message: 'Carrinho esvaziado com sucesso.' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException();
    }
  }
}
