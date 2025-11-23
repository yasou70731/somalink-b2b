import { IsString, IsBoolean, IsArray, IsEnum, IsNumber, ValidateNested, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  serviceType: string;

  @IsObject()
  widthMatrix: { top: number; mid: number; bot: number };

  @IsObject()
  heightData: any;

  @IsBoolean()
  isCeilingMounted: boolean;

  @IsObject()
  @IsOptional()
  siteConditions?: any;

  @IsString()
  colorName: string;

  @IsString()
  materialName: string;

  @IsString()
  openingDirection: string;

  @IsBoolean()
  hasThreshold: boolean;

  @IsNumber()
  quantity: number;

  @IsNumber()
  subtotal: number;

  @IsObject()
  priceSnapshot: any;
}

export class CreateOrderDto {
  @IsString()
  projectName: string;

  @IsBoolean()
  agreedToDisclaimer: boolean;

  // ✨ 新增：選填的客戶備註
  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}