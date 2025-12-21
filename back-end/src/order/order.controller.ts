import { Controller, Post, Body, Req } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Req() req: any, @Body('addressId') addressId: string) {
    const userId = req.user.sub;
    return this.orderService.createOrder(userId, addressId);
  }
}
