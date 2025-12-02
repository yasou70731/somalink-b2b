import { IsString, IsBoolean, IsArray, IsNumber, ValidateNested, IsOptional, IsObject } from 'class-validator';
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

  // ✨✨✨ 新增：把手名稱 (選填) ✨✨✨
  @IsString()
  @IsOptional()
  handleName?: string;

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

  // ✨✨✨ 收貨資訊欄位 ✨✨✨
  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  siteContactPerson?: string;

  @IsString()
  @IsOptional()
  siteContactPhone?: string;

  // ✨✨✨ 附件欄位 (字串陣列) ✨✨✨
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];

  @IsBoolean()
  agreedToDisclaimer: boolean;

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}