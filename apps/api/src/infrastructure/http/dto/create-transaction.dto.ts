import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class DeliveryInlineDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  addressLine1!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  region!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  postalCode!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  qty!: number;

  @ApiPropertyOptional({ type: DeliveryInlineDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryInlineDto)
  delivery?: DeliveryInlineDto;
}
