import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productSlug: string;

  @IsInt()
  @Min(1, { message: 'A quantidade mínima é 1' })
  quantity: number;
}
