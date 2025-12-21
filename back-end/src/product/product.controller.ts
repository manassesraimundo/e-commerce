import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
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
  constructor(private readonly productService: ProductService) { }

  @Get('list')
  async getAllProduct(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const products = await this.productService.getAllProduct(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return products;
  }

  @Get(':slung')
  async getProductBySlug(@Param('slung') slung: string) {
    const product = await this.productService.getProductBySlug(slung);
    return product;
  }

  @Get('category/:catego')
  async getProductsByCategory(
    @Param('catego') catego: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productService.getProductsByCategory(
      catego,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get('search')
  async searchProducts(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productService.searchProducts(
      query,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Post('create')
  @UseGuards(AuthGuard, ProductGuard)
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
  @UseGuards(AuthGuard, ProductGuard)
  async deleteProduct(@Param('slug') slug: string) {
    const message = await this.productService.deleteProduct(slug);
    return message;
  }

  @Post(':productSlug/category/:catego')
  @UseGuards(AuthGuard, ProductGuard)
  async assignProductToCategory(
    @Param('productSlug') productSlug: string,
    @Param('catego') catego: string,
  ) {
    return this.productService.assignProductToCategory(productSlug, catego);
  }

  @Delete(':productSlug/category')
  @UseGuards(AuthGuard, ProductGuard)
  async removeProductFromCategory(@Param('productSlug') productSlug: string) {
    return this.productService.removeProductFromCategory(productSlug);
  }
}
