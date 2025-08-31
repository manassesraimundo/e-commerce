import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthSinInDto {
  @IsString({ message: 'Email must be a string.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;
}
