import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Result } from '../../application/result';

export function unwrapResult<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  switch (result.error.code) {
    case 'OUT_OF_STOCK':
      throw new ConflictException(result.error.message);
    case 'NOT_PENDING':
      throw new ConflictException(result.error.message);
    case 'NOT_FOUND':
      throw new NotFoundException(result.error.message);
    case 'UNAUTHORIZED':
      throw new UnauthorizedException(result.error.message);
    case 'PAYMENT_FAILED':
      throw new BadRequestException(result.error.message);
    case 'VALIDATION':
      throw new BadRequestException(result.error.message);
    default:
      throw new BadRequestException(result.error.message);
  }
}
