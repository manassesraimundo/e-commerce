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
  @IsString({ message: '' })
  @IsNotEmpty({ message: '' })
  name: string;

  @IsString({ message: '' })
  @IsNotEmpty({ message: '' })
  @IsEmail({}, { message: '' })
  email: string;

  @IsString({ message: '' })
  @IsNotEmpty({ message: '' })
  @MinLength(8, { message: '' })
  password: string;

  @IsOptional()
  @IsUppercase({ message: '' })
  @IsEnum(UserRole, { message: 'O role deve ser CUSTOMER, ADMIN ou SELLER' })
  role?: UserRole;
}
