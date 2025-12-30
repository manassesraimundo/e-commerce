import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { diskStorage } from 'multer';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthAdminGuard } from 'src/auth/auth-admin.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

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

  @Post('create')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async createProduct(@Body() body: CreateProductDto) {
    const message = await this.productService.createProduct(body);
    return message;
  }

  @Post('upload-file')
  @UseGuards(AuthGuard, AuthAdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + file.originalname;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = file?.filename ? `/products/${file?.filename}` : null;

    return { imageUrl };
  }

  @Patch(':slug/update')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async updateProduct(
    @Param('slug') slug: string,
    @Body() body: UpdateProductDto,
  ) {
    const res = await this.productService.updateProduct(slug, body);
    return res;
  }

  @Patch(':slug/update-image')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async updateProductImage(
    @Param('slug') slug: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    const re = await this.productService.updateProductImage(slug, imageUrl);
    return re;
  }

  @Delete('delete/:slug')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async deleteProduct(@Param('slug') slug: string) {
    const message = await this.productService.deleteProduct(slug);
    return message;
  }

  @Patch(':productSlug/category/:catego')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async assignProductToCategory(
    @Param('productSlug') productSlug: string,
    @Param('catego') catego: string,
  ) {
    return this.productService.assignProductToCategory(productSlug, catego);
  }

  @Delete(':productSlug/category')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async removeProductFromCategory(@Param('productSlug') productSlug: string) {
    return this.productService.removeProductFromCategory(productSlug);
  }
}
