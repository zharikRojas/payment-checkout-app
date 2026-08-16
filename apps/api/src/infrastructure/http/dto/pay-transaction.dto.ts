import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class PayTransactionDto {
  @ApiProperty({ description: 'Card token from payment provider (never log full value)' })
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  acceptanceToken?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;
}
