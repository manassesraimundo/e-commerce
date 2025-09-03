import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllProduct() {
    try {
      const product = await this.prismaService.product.findMany();
      return product;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error fetching products.');
    }
  }

  async getProductBySlug(slug: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug },
        include: {
          category: { select: { name: true } },
        },
      });
      if (!product) throw new NotFoundException('Product not found.');

      return product;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error fetching product.');
    }
  }

  async updateProduct(slug: string, body: UpdateProductDto) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug },
      });
      if (!product) throw new NotFoundException('Product not found.');

      await this.prismaService.product.update({
        where: { slug },
        data: {
          name: body.name,
          description: body.description,
          pastPrice: body.pastPrice,
          newPrice: body.newPrice,
          stock: body.stock,
          imageUrl: body.imageUrl,
          categoryId: body.categoryId,
        },
      });

      return {
        message: 'Product updated successfully.',
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error updating product.');
    }
  }
}
