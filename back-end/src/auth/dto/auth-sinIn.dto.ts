import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthSinInDto {
  @IsString({ message: '' })
  @IsNotEmpty({ message: '' })
  @IsEmail({}, { message: '' })
  email: string;

  @IsString({ message: '' })
  @IsNotEmpty({ message: '' })
  @MinLength(8, { message: '' })
  password: string;
}
