import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUppercase,
  MinLength,
} from 'class-validator';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
}

export class AuthSinUpDto {
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name is required.' })
  name: string;

  @IsString({ message: 'Email must be a string.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  @IsOptional()
  @IsUppercase({ message: 'Role must be in uppercase letters.' })
  @IsEnum(UserRole, { message: 'Role must be CUSTOMER, ADMIN or SELLER.' })
  role?: UserRole;
}
