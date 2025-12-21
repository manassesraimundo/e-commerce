import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuthModule,
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    CategoryModule,
  ],
})
export class AppModule {}
