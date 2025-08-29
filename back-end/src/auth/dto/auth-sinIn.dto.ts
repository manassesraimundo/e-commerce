import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthSinInDto {
  @IsString({ message: '' })
  @IsNotEmpty({ message: '' })
  name: string;

  @IsString({ message: '' })
  @IsNotEmpty({ message: '' })
  @IsEmail({}, { message: '' })
  email: string;
}
