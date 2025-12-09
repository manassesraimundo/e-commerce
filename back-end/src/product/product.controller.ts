import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { ProductGuard } from './product.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
 
  @Get('list')
  async getAllProduct() {
    const products = await this.productService.getAllProduct();
    return products;
  }

  @Get(':slung')
  async getProductBySlug(@Param('slung') slung: string) {
    const product = await this.productService.getProductBySlug(slung);
    return product;
  }

  @Post('create')
  @UseGuards(AuthGuard)
  @UseGuards(ProductGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createProduct(
    @Body() body: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const imageUrl = file?.filename
      ? `/uploads/products/${file?.filename}`
      : null;

    const message = await this.productService.createProduct(body, imageUrl);
    return message;
  }

  @Delete('delete/:slug')
  @UseGuards(AuthGuard)
  @UseGuards(ProductGuard)
  async deleteProduct(@Param('slug') slug: string) {
    const message = await this.productService.deleteProduct(slug);
    return message;
  }
}
