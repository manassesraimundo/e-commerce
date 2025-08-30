import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [PrismaModule, EmailModule, AuthModule, EmailModule],
})
export class AppModule {}
