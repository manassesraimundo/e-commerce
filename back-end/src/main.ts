import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, '..', 'uploads', 'products'), {
    prefix: '/products/',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
