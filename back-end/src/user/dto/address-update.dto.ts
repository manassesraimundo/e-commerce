import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class AddressUpdateDto {
  @IsOptional()
  @IsString({ message: 'Street must be a string.' })
  street?: string;

  @IsOptional()
  @IsString({ message: 'Number must be a string.' })
  number?: string;

  @IsOptional()
  @IsString({ message: 'Complement must be a string.' })
  complement?: string;

  @IsOptional()
  @IsString({ message: 'Neighborhood must be a string.' })
  neighborhood?: string;

  @IsOptional()
  @IsString({ message: 'City must be a string.' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'State must be a string.' })
  state?: string;

  @IsOptional()
  @IsString({ message: 'Postal code must be a string.' })
  postalCode?: string;

  @IsOptional()
  @IsString({ message: 'Country must be a string.' })
  country?: string;

  @IsOptional()
  @IsBoolean({ message: 'isDefault must be a boolean (true/false).' })
  isDefault?: boolean;
}
