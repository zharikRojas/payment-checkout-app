import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

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
