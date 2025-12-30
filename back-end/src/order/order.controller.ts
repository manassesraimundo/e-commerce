import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthAdminGuard } from 'src/auth/auth-admin.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(@Req() req: any, @Body('addressId') addressId: string) {
    const userId = req.user.sub;
    return this.orderService.createOrder(userId, addressId);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getOrderByUser(@Req() req: any) {
    const userId = req.user.sub;

    const result = await this.orderService.getOrderByUser(userId);

    return result;
  }

  @Get(':status/admin')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async getAllOrderByStatus(
    @Param('status') status: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.orderService.getAllOrderByStatus(
      status,
      Number(page) || 1,
      Number(limit) || 10,
    );

    return result;
  }

  @Get('/admin')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async getAllOrder(@Req() req: any) {
    const result = await this.orderService.getAllOrder();

    return result;
  }
}
