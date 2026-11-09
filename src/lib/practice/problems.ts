import { z } from "zod";
import { checkStep, STARTER_EQUATION } from "@/lib/math/verifier";

const pairs = Array.from({ length: 7 }, (_, i) => i + 2).flatMap(a =>
  Array.from({ length: 6 }, (_, i) => i + 1).filter(c => c !== a).map(c => [a, c] as const));
export const PROBLEM_COUNT = pairs.length * 6 * 9 * 2 * 4;
export const ProblemRef = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("starter") }).strict(),
  z.object({ kind: z.literal("generated"), seed: z.number().int().min(0).max(PROBLEM_COUNT - 1) }).strict(),
]);
export type ProblemRef = z.infer<typeof ProblemRef>;
export type Problem = {
  id: string; equation: string; variable: "x" | "y";
  difficulty: "Intro" | "Standard" | "Challenge";
  source: "starter" | "generated";
};
export const STARTER_REF: ProblemRef = { kind: "starter" };

// A finite, varied coefficient space makes generation reproducible on both
// boundaries. The public problem never includes the chosen solution.
export function resolveProblem(reference: ProblemRef): Problem {
  const ref = ProblemRef.parse(reference);
  if (ref.kind === "starter") return { id: "starter", equation: STARTER_EQUATION, variable: "x", difficulty: "Intro", source: "starter" };
  let index = ref.seed;
  const variant = index % 4; index = Math.floor(index / 4);
  const variable = index % 2 === 0 ? "x" : "y"; index = Math.floor(index / 2);
  let answer = index % 9 + 1; index = Math.floor(index / 9);
  let b = index % 6 + 1; index = Math.floor(index / 6);
  const pair = pairs[index];
  if (!pair) throw new Error("Problem seed is outside the coefficient space.");
  let a = pair[0];
  const c = pair[1];
  if (variant === 1) a = -a;
  if (variant === 2) b = -b;
  if (variant === 3) answer = -answer;
  const d = (a - c) * answer + a * b;
  const equation = `${a}(${variable} ${b < 0 ? "-" : "+"} ${Math.abs(b)}) = ${c}${variable} ${d < 0 ? "-" : "+"} ${Math.abs(d)}`;
  const verified = checkStep(equation, `${variable}=${answer}`);
  if (!verified.canAdvance || !verified.isComplete) throw new Error("Generated equation did not pass independent verification.");
  return { id: `generated:${ref.seed}`, equation, variable, difficulty: variant ? "Challenge" : a <= 5 && b <= 4 ? "Intro" : "Standard", source: "generated" };
}

export function generateProblem(excluded: readonly ProblemRef[], random: () => number = Math.random): ProblemRef {
  const used = new Set(excluded.map(ref => resolveProblem(ref).equation.replace(/\s/g, "")));
  used.add(STARTER_EQUATION.replace(/\s/g, ""));
  const draw = random();
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error("Random source must return a value in [0, 1).");
  // Prefer positive beginner coefficients, while retaining genuine negative
  // variants and a bounded scan when the first choice has already been used.
  const sampled = Math.floor(draw * PROBLEM_COUNT);
  const start = draw < 0.8 ? sampled - sampled % 4 : sampled;
  for (let offset = 0; offset < PROBLEM_COUNT; offset++) {
    const ref: ProblemRef = { kind: "generated", seed: (start + offset) % PROBLEM_COUNT };
    if (!used.has(resolveProblem(ref).equation.replace(/\s/g, ""))) return ref;
  }
  throw new Error("All available equations have been used. Clear saved history to start a new set.");
}
