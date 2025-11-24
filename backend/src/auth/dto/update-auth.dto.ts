import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
  // Define properties for CreateAuthDto here if needed, 
  // or remove if unused. For now, keeping it empty to avoid breaking other imports.
}

export class AuthPayloadDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}