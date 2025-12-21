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
  constructor(private readonly prismaService: PrismaService) { }

  private getPagination(page = 1, limit = 10) {
    const take = Math.min(Number(limit), 50); // limite de segurança
    const skip = (Number(page) - 1) * take;

    return { skip, take };
  }

  async getAllProduct(page = 1, limit = 10) {
    try {
      const { skip, take } = this.getPagination(page, limit);

      const [products, total] = await this.prismaService.$transaction([
        this.prismaService.product.findMany({
          where: { isActive: true },
          skip,
          take,
        }),
        this.prismaService.product.count({
          where: { isActive: true },
        }),
      ]);

      return {
        data: products,
        meta: {
          total,
          page: Number(page),
          limit: Number(take),
          totalPages: Math.ceil(total / take),
        },
      };
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

  async getProductsByCategory(name: string, page = 1, limit = 10) {
    try {
      const category = await this.prismaService.category.findUnique({
        where: { name },
        select: { id: true, name: true },
      });

      if (!category) {
        throw new NotFoundException('Category not found.');
      }

      const { skip, take } = this.getPagination(page, limit);

      const [products, total] = await this.prismaService.$transaction([
        this.prismaService.product.findMany({
          where: {
            categoryId: category.id,
            isActive: true,
          },
          skip,
          take,
        }),
        this.prismaService.product.count({
          where: {
            categoryId: category.id,
            isActive: true,
          },
        }),
      ]);

      return {
        category: category.name,
        data: products,
        meta: {
          total,
          page: Number(page),
          limit: Number(take),
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error updating product.');
    }
  }

  async searchProducts(query: string, page = 1, limit = 10) {
    try {
      if (!query || query.trim() === '') {
        throw new BadRequestException('Search query cannot be empty.');
      }

      const { skip, take } = this.getPagination(page, limit);

      const [products, total] = await this.prismaService.$transaction([
        this.prismaService.product.findMany({
          where: {
            isActive: true,
            name: {
              contains: query,
              // @ts-expect-error TS não reconhece 'mode'
              mode: 'insensitive',
            },
          },
          skip,
          take,
        }),
        this.prismaService.product.count({
          where: {
            isActive: true,
            name: {
              contains: query,
              // @ts-expect-error TS não reconhece 'mode'
              mode: 'insensitive',
            },
          },
        }),
      ]);

      return {
        data: products,
        meta: {
          total,
          page: Number(page),
          limit: Number(take),
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error searching products.');
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

  async assignProductToCategory(productSlug: string, name: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug: productSlug },
      });
      if (!product) throw new NotFoundException('Product not found.');

      const category = await this.prismaService.category.findUnique({
        where: { name },
      });
      if (!category) throw new NotFoundException('Category not found.');

      await this.prismaService.product.update({
        where: { slug: productSlug },
        data: { categoryId: category.id },
      });

      return { message: `Product '${product.name}' assigned to category '${category.name}' successfully.` };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error assigning product to category.');
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

  async removeProductFromCategory(productSlug: string) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { slug: productSlug },
      });

      if (!product) throw new NotFoundException('Product not found.');

      if (!product.categoryId) {
        return { message: 'Product is already not assigned to any category.' };
      }

      await this.prismaService.product.update({
        where: { slug: productSlug },
        data: { categoryId: null },
      });

      return { message: `Product '${product.name}' removed from its category.` };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException('Error removing product from category.');
    }
  }
}
