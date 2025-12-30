import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async createCategory(body: CreateCategoryDto) {
    try {
      const existsCategory = await this.prismaService.category.findUnique({
        where: { name: body.name },
      });

      if (existsCategory) {
        throw new BadRequestException('Category already exists.');
      }

      await this.prismaService.category.create({
        data: { name: body.name },
      });

      return { message: 'Category created successfully' };
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Error creating category.');
    }
  }

  async getAllCategories() {
    try {
      const categorys = await this.prismaService.category.findMany({
        orderBy: { name: 'asc' },
      });

      return categorys;
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Error to list category.');
    }
  }

  async deletedCategory(categoryId: string) {
    try {
      const category = await this.prismaService.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) throw new NotFoundException('Not found category.');

      const nameCategory = category.name;

      await this.prismaService.category.delete({
        where: { id: category.id },
      });

      return { message: `Category ${nameCategory} deleted.` };
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Error to deleted category.');
    }
  }
}
