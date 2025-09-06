import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  async deleteProduct(@Param('slug') slug: string) {
    const message = await this.productService.deleteProduct(slug);
    return message;
  }
}
