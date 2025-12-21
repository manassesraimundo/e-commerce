import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ProductGuard } from 'src/product/product.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Get()
  async getAllCategories() {
    const categorys = await this.categoryService.getAllCategories();

    return categorys;
  }

  @Post()
  @UseGuards(AuthGuard, ProductGuard)
  async createCategory(@Body() body: CreateCategoryDto) {
    const res = await this.categoryService.createCategory(body);

    return res;
  }
}
