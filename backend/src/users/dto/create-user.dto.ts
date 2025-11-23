import { IsString, IsEmail, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

// 定義經銷商資料結構 (內嵌於 User DTO)
class CreateDealerProfileDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string; // 聯絡人姓名

  // 允許 tradeCategoryId 為字串或 undefined (處理前端傳來的空值)
  @IsOptional()
  @IsString()
  tradeCategoryId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDealerProfileDto)
  dealerProfile?: CreateDealerProfileDto;
}