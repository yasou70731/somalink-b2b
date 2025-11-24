import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
  // Define properties for CreateAuthDto here if needed, 
  // or remove if unused. For now, keeping it empty to avoid breaking other imports.
}

// ✨ Added 'export' here so it can be imported by auth.service.ts
export class AuthPayloadDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}