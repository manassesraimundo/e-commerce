import {
  IsString,
  IsOptional,
  IsInt,
  IsUrl,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string.' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Slug must be a string.' })
  slug?: string;

  @IsOptional()
  @IsInt({ message: 'Past price must be an integer.' })
  @Min(0, { message: 'Past price cannot be negative.' })
  pastPrice?: number;

  @IsOptional()
  @IsInt({ message: 'New price must be an integer.' })
  @Min(0, { message: 'New price cannot be negative.' })
  newPrice?: number;

  @IsOptional()
  @IsInt({ message: 'Stock must be an integer.' })
  @Min(0, { message: 'Stock cannot be negative.' })
  stock?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL.' })
  imageUrl?: string;

  @IsOptional()
  @IsString({ message: 'Category ID must be a string.' })
  categoryId?: string;
}
