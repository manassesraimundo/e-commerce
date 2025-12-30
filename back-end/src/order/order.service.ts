import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

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

  async getAllOrder(page = 1, limit = 10) {
    const { take, skip } = this.getPagination(page, limit);
    try {
      const [
        orders,
        totalOrders,
        totalOrdersPending,
        totalOrdersProcessing,
        totalOrdersCanceled,
        totalOrdersPaid,
        totalOrdersDeliverd,
        totalOrdersShipped,
      ] = await this.prismaService.$transaction([
        this.prismaService.order.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                addresses: {
                  where: { isDefault: true },
                  select: {
                    id: true,
                    city: true,
                    street: true,
                    postalCode: true,
                    number: true,
                    country: true,
                    neighborhood: true,
                    complement: true,
                  },
                },
              },
            },
            items: {
              select: {
                id: true,
                product: {
                  omit: {
                    stock: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                  include: { category: { select: { id: true, name: true } } },
                },
              },
            },
          },
          take,
          skip,
        }),
        this.prismaService.order.count(),
        this.prismaService.order.count({
          where: { status: 'PENDING' },
        }),
        this.prismaService.order.count({
          where: { status: 'PROCESSING' },
        }),
        this.prismaService.order.count({
          where: { status: 'CANCELED' },
        }),
        this.prismaService.order.count({
          where: { status: 'PAID' },
        }),
        this.prismaService.order.count({
          where: { status: 'DELIVERED' },
        }),
        this.prismaService.order.count({
          where: { status: 'SHIPPED' },
        }),
      ]);

      return {
        orders: orders,
        meta: {
          totalOrders,
          totalOrdersPending,
          totalOrdersProcessing,
          totalOrdersCanceled,
          totalOrdersPaid,
          totalOrdersDeliverd,
          totalOrdersShipped,
          page,
          limit,
          totalPages: Math.ceil(totalOrders / take),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha ao processar o pedido. Tente novamente.',
      );
    }
  }

  async getAllOrderByStatus(status: string, page = 1, limit = 10) {
    const { take, skip } = this.getPagination(page, limit);

    try {
      if (!OrderStatus[status.toUpperCase()])
        throw new BadRequestException(
          `Status ${status.toUpperCase()} invalido.`,
        );

      const [orders, totalOrders] = await this.prismaService.$transaction([
        this.prismaService.order.findMany({
          where: { status: OrderStatus[status.toUpperCase()] },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                addresses: {
                  where: { isDefault: true },
                  select: {
                    id: true,
                    city: true,
                    street: true,
                    postalCode: true,
                    number: true,
                    country: true,
                    neighborhood: true,
                    complement: true,
                  },
                },
              },
            },
            items: {
              select: {
                id: true,
                product: {
                  omit: {
                    stock: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                  include: { category: { select: { id: true, name: true } } },
                },
              },
            },
          },
          skip,
          take,
        }),

        this.prismaService.order.count({
          where: { status: OrderStatus[status.toUpperCase()] },
        }),
      ]);

      return {
        orders: orders,
        meta: {
          totalOrders,
          page,
          limit,
          totalPages: Math.ceil(totalOrders / take),
        },
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException();
    }
  }

  async getOrderByUser(userId: string) {
    try {
      const orders = await this.prismaService.order.findMany({
        where: { userId },
        include: { items: true },
      });

      if (!orders) throw new NotFoundException('Not found order.');

      return orders;
    } catch (error) {
      throw new InternalServerErrorException(
        'Falha ao processar o pedido. Tente novamente.',
      );
    }
  }

  private getPagination(page = 1, limit = 10) {
    const take = Math.min(Number(limit), 50);
    const skip = (Number(page) - 1) * take;

    return { take, skip };
  }
}
