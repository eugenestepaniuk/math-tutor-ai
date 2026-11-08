export class MathInputError extends Error {
  constructor(public readonly kind: "invalid" | "unsupported", message: string) {
    super(message);
  }
}

export type Rational = Readonly<{ numerator: bigint; denominator: bigint }>;
const LIMIT = 10n ** 24n;
const abs = (value: bigint) => value < 0n ? -value : value;

export function rational(numerator: bigint, denominator = 1n): Rational {
  if (denominator === 0n) throw new MathInputError("unsupported", "Division by zero is not allowed.");
  if (abs(numerator) > LIMIT || abs(denominator) > LIMIT) {
    throw new MathInputError("unsupported", "These numbers are too large. Use smaller values.");
  }
  let a = abs(numerator);
  let b = abs(denominator);
  while (b !== 0n) [a, b] = [b, a % b];
  const divisor = a || 1n;
  const sign = denominator < 0n ? -1n : 1n;
  return { numerator: sign * numerator / divisor, denominator: abs(denominator) / divisor };
}

export const ZERO = rational(0n);
export const ONE = rational(1n);
export const isZero = (value: Rational) => value.numerator === 0n;
export const equals = (a: Rational, b: Rational) => a.numerator === b.numerator && a.denominator === b.denominator;
export const add = (a: Rational, b: Rational) => rational(a.numerator * b.denominator + b.numerator * a.denominator, a.denominator * b.denominator);
export const negate = (a: Rational) => rational(-a.numerator, a.denominator);
export const subtract = (a: Rational, b: Rational) => add(a, negate(b));
export const multiply = (a: Rational, b: Rational) => rational(a.numerator * b.numerator, a.denominator * b.denominator);
export const divide = (a: Rational, b: Rational) => rational(a.numerator * b.denominator, a.denominator * b.numerator);
export const formatRational = (a: Rational) => a.denominator === 1n ? String(a.numerator) : `${a.numerator}/${a.denominator}`;
