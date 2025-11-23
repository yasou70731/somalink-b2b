import { IsString, IsBoolean, IsArray, IsEnum, IsNumber, ValidateNested, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// 1. 定義單一門扇的 DTO (對應 OrderItem)
export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsEnum(['material', 'assembled'])
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
  subtotal: number; // 該品項總價

  @IsObject()
  priceSnapshot: {
    basePrice: number;
    sizeSurcharge: number;
    colorSurcharge: number;
    materialSurcharge: number;
    assemblyFee: number;
    thresholdFee: number;
  };
}

// 2. 定義整張訂單的 DTO
export class CreateOrderDto {
  @IsString()
  projectName: string; // 案場名稱

  @IsBoolean()
  agreedToDisclaimer: boolean;

  // ✨ 關鍵改變：這裡接收一個 Item 陣列
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}