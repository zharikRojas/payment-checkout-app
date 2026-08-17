import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { err, ok } from '../../application/result';
import { unwrapResult } from './unwrap-result';

describe('unwrapResult', () => {
  it('returns the value when ok', () => {
    expect(unwrapResult(ok(7))).toBe(7);
  });

  it.each([
    ['OUT_OF_STOCK', ConflictException],
    ['NOT_PENDING', ConflictException],
    ['NOT_FOUND', NotFoundException],
    ['UNAUTHORIZED', UnauthorizedException],
    ['PAYMENT_FAILED', BadRequestException],
    ['VALIDATION', BadRequestException],
  ] as const)('maps %s', (code, Ctor) => {
    expect(() => unwrapResult(err({ code, message: code }))).toThrow(Ctor);
  });

  it('maps unknown codes to BadRequest', () => {
    expect(() =>
      unwrapResult({ ok: false, error: { code: 'NOPE', message: 'x' } } as never),
    ).toThrow(BadRequestException);
  });
});
