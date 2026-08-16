export type AppError = {
  code:
    | 'OUT_OF_STOCK'
    | 'NOT_FOUND'
    | 'VALIDATION'
    | 'NOT_PENDING'
    | 'PAYMENT_FAILED'
    | 'UNAUTHORIZED';
  message: string;
};

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}
