import type { Equation, Expression } from "./parser";
import { add, divide, equals, isZero, MathInputError, multiply, negate, ONE, type Rational, subtract, ZERO } from "./rational";

export type Linear = { coefficient: Rational; constant: Rational };
export type Solution = { kind: "unique"; value: Rational } | { kind: "all" | "none" };
export const linearEquals = (a: Linear, b: Linear) => equals(a.coefficient, b.coefficient) && equals(a.constant, b.constant);

export function reduceExpression(node: Expression, replacement?: { target: Expression; value: Linear }): Linear {
  if (node === replacement?.target) return replacement.value;
  switch (node.kind) {
    case "number": return { coefficient: ZERO, constant: { numerator: node.value, denominator: 1n } };
    case "variable": return { coefficient: ONE, constant: ZERO };
    case "group": return reduceExpression(node.inner, replacement);
    case "negative": {
      const value = reduceExpression(node.inner, replacement);
      return { coefficient: negate(value.coefficient), constant: negate(value.constant) };
    }
    case "binary": {
      const a = reduceExpression(node.left, replacement);
      const b = reduceExpression(node.right, replacement);
      if (node.operator === "+" || node.operator === "-") {
        const operation = node.operator === "+" ? add : subtract;
        return { coefficient: operation(a.coefficient, b.coefficient), constant: operation(a.constant, b.constant) };
      }
      if (node.operator === "/") {
        if (!isZero(b.coefficient)) throw new MathInputError("unsupported", "Divide only by a nonzero number, not by a variable.");
        return { coefficient: divide(a.coefficient, b.constant), constant: divide(a.constant, b.constant) };
      }
      if (!isZero(a.coefficient) && !isZero(b.coefficient)) {
        throw new MathInputError("unsupported", "This checker supports linear equations. Multiplying variables is not supported.");
      }
      return {
        coefficient: add(multiply(a.coefficient, b.constant), multiply(b.coefficient, a.constant)),
        constant: multiply(a.constant, b.constant),
      };
    }
  }
}

export function solveEquation(equation: Equation): Solution {
  const left = reduceExpression(equation.left);
  const right = reduceExpression(equation.right);
  const coefficient = subtract(left.coefficient, right.coefficient);
  const constant = subtract(right.constant, left.constant);
  if (isZero(coefficient)) return { kind: isZero(constant) ? "all" : "none" };
  return { kind: "unique", value: divide(constant, coefficient) };
}

export function solutionsEqual(a: Solution, b: Solution): boolean {
  return a.kind === b.kind && (a.kind !== "unique" || (b.kind === "unique" && equals(a.value, b.value)));
}
