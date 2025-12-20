import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllProduct() {
    try {
      const product = await this.prismaService.product.findMany({
        where: { isActive: true },
      });
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

  async createProduct(body: CreateProductDto, imageUrl?: string | null) {
    try {
      if (body.pastPrice && body.newPrice > body.pastPrice) {
        throw new BadRequestException('');
      }

      if (body.stock < 0) {
        throw new BadRequestException('');
      }

      const product = await this.prismaService.product.findUnique({
        where: { slug: body.slug },
      });

      if (product) throw new BadRequestException('Slug already exists.');

      await this.prismaService.product.create({
        data: {
          name: body.name,
          slug: body.slug,
          newPrice: body.newPrice,
          pastPrice: body.pastPrice,
          stock: body.stock,
          description: body.description,
          imageUrl: body.imageUrl ?? imageUrl,
          categoryId: body.categoryId,
        },
      });

      return { message: 'Product created successfully.' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error create product.');
    }
  }

  async updateProductImage(slug: string, filename: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug },
      });
      if (!product) throw new NotFoundException('Product not found.');

      await this.prismaService.product.update({
        where: { slug },
        data: { imageUrl: `/uploads/products/${filename}` },
      });

      return { message: 'Image uploaded successfully.' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error updating product.');
    }
  }

  async updateProduct(slug: string, body: UpdateProductDto) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug },
      });
      if (!product) throw new NotFoundException('Product not found.');

      if (body.pastPrice && body.newPrice && body.newPrice > body.pastPrice) {
        throw new BadRequestException('');
      }

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

  async deleteProduct(slug: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug },
      });
      if (!product) throw new NotFoundException('Product not found.');

      await this.prismaService.product.update({
        where: { slug },
        data: { isActive: false },
      });

      return { message: 'Product deleted successfully.' };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error deleting product.');
    }
  }
}
