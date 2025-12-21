import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrder(userId: string, addressId: string) {
    try {
      const cart = await this.prismaService.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length == 0) {
        throw new BadRequestException('Seu carrinho está vazio.');
      }

      let totalPrice = 0;
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto: ${item.product.name}`,
          );
        }
        totalPrice += item.product.newPrice * item.quantity;
      }

      return await this.prismaService.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId,
            addressId,
            totalPrice,
            status: 'PENDING',
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.product.newPrice,
              })),
            },
          },
        });

        for (const item of cart.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }

        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return order;
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha ao processar o pedido. Tente novamente.',
      );
    }
  }
}
