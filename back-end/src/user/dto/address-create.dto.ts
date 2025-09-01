import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class AddressCreateDto {
  @IsNotEmpty({ message: 'Street is required.' })
  @IsString({ message: 'Street must be a string.' })
  street: string;

  @IsOptional()
  @IsString({ message: 'Number must be a string.' })
  number?: string;

  @IsOptional()
  @IsString({ message: 'Complement must be a string.' })
  complement?: string;

  @IsOptional()
  @IsString({ message: 'Neighborhood must be a string.' })
  neighborhood?: string;

  @IsNotEmpty({ message: 'City is required.' })
  @IsString({ message: 'City must be a string.' })
  city: string;

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
