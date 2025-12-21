import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { AddToCartDto } from './dto/cart.dto';

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('validate')
  async validateStock(@Body() data: AddToCartDto) {
    return this.cartService.validateStock(data);
  }

  @Get()
  async getCart(@Req() req: any) {
    const userId = req.user.sub;
    return this.cartService.getCart(userId);
  }

  @Post('add')
  async addItemToCart(@Req() req: any, @Body() data: AddToCartDto) {
    const userId = req.user.sub;
    return this.cartService.addItemToCart(userId, data);
  }

  @Delete('remove/:productId')
  async removeItem(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user.sub;
    return this.cartService.removeItem(userId, productId);
  }

  @Delete('clear')
  async clearCart(@Req() req: any) {
    const userId = req.user.sub;
    return this.cartService.clearCart(userId);
  }
}
