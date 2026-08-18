import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class CreateCardTokenDto {
  @ApiProperty({ description: 'Card number (test cards only; never logged)' })
  @IsString()
  @MinLength(13)
  number!: string;

  @ApiProperty({ description: 'CVC (never logged)' })
  @IsString()
  @Matches(/^\d{3,4}$/)
  cvc!: string;

  @ApiProperty({ example: '12' })
  @IsString()
  @Matches(/^\d{1,2}$/)
  expMonth!: string;

  @ApiProperty({ example: '29' })
  @IsString()
  @Matches(/^\d{2}(\d{2})?$/)
  expYear!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  cardHolder!: string;
}
