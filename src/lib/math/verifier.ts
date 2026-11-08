import { fingerprint, parseEquation, type Equation, type Expression, unwrap } from "./parser";
import { linearEquals, reduceExpression, solveEquation, solutionsEqual, type Linear } from "./linear";
import { formatRational, isZero, MathInputError, multiply } from "./rational";

export const STARTER_EQUATION = "3(x + 4) = 2x + 19";
export type MistakeKind = "distribution" | "combine_like_terms" | "sign_or_balance" | "arithmetic" | "unsupported_step" | "none";
export type Stage = "expand" | "combine" | "isolate" | "check";
export type CheckResult = {
  parseStatus: "valid" | "invalid" | "unsupported";
  verdict: "correct" | "incorrect" | "unchanged" | "uncertain";
  mistakeKind: MistakeKind;
  previousEquation: string;
  submittedEquation: string;
  canonicalSolution: string | null;
  canAdvance: boolean;
  isComplete: boolean;
  stage: Stage;
  title: string;
  message: string;
};

function distributionReplacements(node: Expression): { target: Expression; value: Linear }[] {
  const candidates: { target: Expression; value: Linear }[] = [];
  if (node.kind === "binary") {
    if (node.operator === "*") {
      for (const [scalar, grouped] of [[node.left, node.right], [node.right, node.left]] as const) {
        if (grouped.kind !== "group") continue;
        const outside = reduceExpression(scalar);
        const inside = reduceExpression(grouped);
        if (isZero(outside.coefficient) && !isZero(inside.coefficient) && !isZero(inside.constant)) {
          candidates.push({ target: node, value: { coefficient: multiply(outside.constant, inside.coefficient), constant: inside.constant } });
        }
      }
    }
    candidates.push(...distributionReplacements(node.left), ...distributionReplacements(node.right));
  } else if (node.kind === "group" || node.kind === "negative") {
    candidates.push(...distributionReplacements(node.inner));
  }
  return candidates;
}

function omittedDistribution(previous: Equation, submitted: Equation): boolean {
  for (const side of ["left", "right"] as const) {
    const other = side === "left" ? "right" : "left";
    const before = distributionReplacements(previous[side]);
    if (before.length <= distributionReplacements(submitted[side]).length) continue;
    if (!linearEquals(reduceExpression(previous[other]), reduceExpression(submitted[other]))) continue;
    for (const replacement of before) {
      if (linearEquals(reduceExpression(previous[side], replacement), reduceExpression(submitted[side]))) return true;
    }
  }
  return false;
}

function isolated(equation: Equation): boolean {
  const left = unwrap(equation.left);
  const right = unwrap(equation.right);
  const hasVariable = (node: Expression): boolean => {
    if (node.kind === "variable") return true;
    if (node.kind === "binary") return hasVariable(node.left) || hasVariable(node.right);
    return node.kind === "group" || node.kind === "negative" ? hasVariable(node.inner) : false;
  };
  return (left.kind === "variable" && !hasVariable(right)) || (right.kind === "variable" && !hasVariable(left));
}

export function stageForEquation(equation: Equation): Stage {
  if (isolated(equation)) return "check";
  if (distributionReplacements(equation.left).length || distributionReplacements(equation.right).length) return "expand";
  const left = reduceExpression(equation.left);
  const right = reduceExpression(equation.right);
  return !isZero(left.coefficient) && !isZero(right.coefficient) ? "combine" : "isolate";
}

export function checkStep(previousEquation: string, submittedEquation: string): CheckResult {
  const base: CheckResult = {
    parseStatus: "valid", verdict: "uncertain", mistakeKind: "none",
    previousEquation, submittedEquation, canonicalSolution: null,
    canAdvance: false, isComplete: false, stage: "expand", title: "Check your equation", message: "",
  };
  try {
    const previous = parseEquation(previousEquation);
    const previousSolution = solveEquation(previous);
    base.stage = stageForEquation(previous);
    const submitted = parseEquation(submittedEquation);
    const submittedSolution = solveEquation(submitted);
    if (previous.variable && submitted.variable && previous.variable !== submitted.variable) {
      throw new MathInputError("unsupported", `Keep the variable ${previous.variable} for this problem.`);
    }
    if (previousSolution.kind === "unique") base.canonicalSolution = `${previous.variable} = ${formatRational(previousSolution.value)}`;
    if (fingerprint(previous.left) === fingerprint(submitted.left) && fingerprint(previous.right) === fingerprint(submitted.right)) {
      return { ...base, verdict: "unchanged", title: "That’s the same step", message: "Try changing the equation using an operation that keeps both sides balanced." };
    }
    if (solutionsEqual(previousSolution, submittedSolution)) {
      const isComplete = previousSolution.kind === "unique" && isolated(submitted);
      return {
        ...base, verdict: "correct", canAdvance: true, isComplete, stage: stageForEquation(submitted),
        title: isComplete ? "Nice work. Equation solved!" : "Your step checks out",
        message: isComplete
          ? base.stage === "expand"
            ? "Your value is verified. To practise the distributive property, try again and show how you expanded the brackets."
            : "Your value is verified against the original equation. You can review your steps or start again."
          : "This equation has the same solution. Keep going with your next step.",
      };
    }
    const distribution = omittedDistribution(previous, submitted);
    return {
      ...base, verdict: "incorrect", mistakeKind: distribution ? "distribution" : "unsupported_step",
      title: distribution ? "Look at the distribution" : "Let’s look at that step",
      message: distribution ? "The outside factor was applied to the variable term but not the constant. Which terms inside the brackets need to be multiplied?" : "This step changes the solution. What operation did you apply to both sides?",
    };
  } catch (error) {
    if (!(error instanceof MathInputError)) throw error;
    return { ...base, parseStatus: error.kind, title: error.kind === "invalid" ? "Check the equation format" : "That step isn’t supported", message: error.message };
  }
}
