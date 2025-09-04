import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
// import * as cookieParser from 'cookie-parser';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/products/images/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
