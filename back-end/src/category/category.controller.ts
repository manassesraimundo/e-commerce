import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthAdminGuard } from 'src/auth/auth-admin.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAllCategories() {
    const categorys = await this.categoryService.getAllCategories();

    return categorys;
  }

  @Post()
  @UseGuards(AuthGuard, AuthAdminGuard)
  async createCategory(@Body() body: CreateCategoryDto) {
    const res = await this.categoryService.createCategory(body);

    return res;
  }

  @Delete(':categoryId')
  @UseGuards(AuthGuard, AuthAdminGuard)
  async deletedCategory(@Param('categoryId') categoryId: string) {
    const re = await this.categoryService.deletedCategory(categoryId);

    return re;
  }
}
