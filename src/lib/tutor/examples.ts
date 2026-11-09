import { parseEquation, type Expression } from "@/lib/math/parser";
import { reduceExpression, type Linear } from "@/lib/math/linear";
import { divide, formatRational, isZero, subtract, ZERO } from "@/lib/math/rational";
import { checkStep } from "@/lib/math/verifier";

function linearText(value: Linear, variable: string): string {
  const coefficient = formatRational(value.coefficient);
  const constant = formatRational(value.constant);
  if (isZero(value.coefficient)) return constant;
  const term = coefficient === "1" ? variable : coefficient === "-1" ? `-${variable}` : `(${coefficient})*${variable}`;
  return isZero(value.constant) ? term : `${term}+(${constant})`;
}

function expressionText(node: Expression, target?: Expression, replacement?: string): string {
  if (node === target && replacement) return `(${replacement})`;
  if (node.kind === "number") return String(node.value);
  if (node.kind === "variable") return node.name;
  if (node.kind === "group") return `(${expressionText(node.inner, target, replacement)})`;
  if (node.kind === "negative") return `-(${expressionText(node.inner, target, replacement)})`;
  return `(${expressionText(node.left, target, replacement)}${node.operator}${expressionText(node.right, target, replacement)})`;
}

function firstDistribution(node: Expression): { target: Expression; expansion: string } | null {
  if (node.kind === "binary") {
    if (node.operator === "*") {
      for (const [scalar, group] of [[node.left, node.right], [node.right, node.left]] as const) {
        if (group.kind !== "group") continue;
        const a = reduceExpression(scalar);
        const b = reduceExpression(group);
        if (isZero(a.coefficient) && !isZero(b.coefficient) && !isZero(b.constant)) {
          return { target: node, expansion: `(${formatRational(a.constant)})*(${expressionText(group.inner)})` };
        }
      }
    }
    return firstDistribution(node.left) ?? firstDistribution(node.right);
  }
  return node.kind === "group" || node.kind === "negative" ? firstDistribution(node.inner) : null;
}

export function verifiedExample(equation: string, depth: number): string | null {
  if (depth < 2) return null;
  const parsed = parseEquation(equation);
  const variable = parsed.variable ?? "x";
  const left = reduceExpression(parsed.left);
  const right = reduceExpression(parsed.right);
  const distribution = firstDistribution(parsed.left) ?? firstDistribution(parsed.right);
  let scaffold: string;
  let corrected: string;
  if (distribution) {
    // Leave the constant multiplication visible and unfinished at level two.
    const node = distribution.target;
    if (node.kind !== "binary") return null;
    const group = node.left.kind === "group" && !isZero(reduceExpression(node.left).coefficient) ? node.left : node.right;
    const scalar = group === node.left ? node.right : node.left;
    const a = reduceExpression(scalar).constant;
    const b = reduceExpression(group);
    const variableTerm = linearText({ coefficient: b.coefficient, constant: ZERO }, variable);
    const expanded = `(${formatRational(a)})*(${variableTerm})+(${formatRational(a)})*(${formatRational(b.constant)})`;
    scaffold = `${expressionText(parsed.left, node, expanded)}=${expressionText(parsed.right, node, expanded)}`;
    corrected = `${linearText(left, variable)}=${linearText(right, variable)}`;
  } else if (!isZero(left.coefficient) && !isZero(right.coefficient)) {
    const term = linearText({ coefficient: right.coefficient, constant: ZERO }, variable);
    scaffold = `(${expressionText(parsed.left)})-(${term})=(${expressionText(parsed.right)})-(${term})`;
    corrected = `${linearText({ coefficient: subtract(left.coefficient, right.coefficient), constant: left.constant }, variable)}=${formatRational(right.constant)}`;
  } else {
    const variableOnLeft = !isZero(left.coefficient);
    const side = variableOnLeft ? left : right;
    const other = variableOnLeft ? right : left;
    if (!isZero(side.constant)) {
      const constant = formatRational(side.constant);
      scaffold = `(${expressionText(parsed.left)})-(${constant})=(${expressionText(parsed.right)})-(${constant})`;
      const changed = { coefficient: side.coefficient, constant: ZERO };
      const scalar = { coefficient: other.coefficient, constant: subtract(other.constant, side.constant) };
      corrected = variableOnLeft ? `${linearText(changed, variable)}=${linearText(scalar, variable)}` : `${linearText(scalar, variable)}=${linearText(changed, variable)}`;
    } else {
      if (isZero(side.coefficient)) return null;
      const coefficient = formatRational(side.coefficient);
      scaffold = `(${expressionText(parsed.left)})/(${coefficient})=(${expressionText(parsed.right)})/(${coefficient})`;
      const value = formatRational(divide(other.constant, side.coefficient));
      corrected = variableOnLeft ? `${variable}=${value}` : `${value}=${variable}`;
    }
  }
  const candidate = depth === 2 ? scaffold : corrected;
  if (candidate.length > 256) return null;
  const result = checkStep(equation, candidate);
  return result.verdict === "correct" || result.verdict === "unchanged" ? candidate : null;
}
