import { describe, expect, it } from "vitest";
import { generateProblem, PROBLEM_COUNT, resolveProblem, type ProblemRef } from "@/lib/practice/problems";
import { parseEquation } from "@/lib/math/parser";
import { solveEquation } from "@/lib/math/linear";
import { checkStep, STARTER_EQUATION } from "@/lib/math/verifier";
import { POST } from "@/app/api/check-step/route";
import { teachingContext } from "@/lib/tutor/policy";
import { tutorInput } from "@/lib/tutor/prompt";

describe("independent related-problem generation", () => {
  it("M12 generates 100 varied, nonrepeating, uniquely solvable integer problems", () => {
    const refs: ProblemRef[] = [];
    let seed = 7321;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const equations = new Set<string>();
    const variables = new Set<string>();
    const difficulties = new Set<string>();
    let positiveVariants = 0;
    for (let n = 0; n < 100; n++) {
      const ref = generateProblem(refs, random); refs.push(ref);
      const problem = resolveProblem(ref);
      expect(problem.equation.replace(/\s/g, "")).not.toBe(STARTER_EQUATION.replace(/\s/g, ""));
      const solution = solveEquation(parseEquation(problem.equation));
      expect(solution.kind).toBe("unique");
      if (solution.kind !== "unique") throw new Error("Not unique");
      expect(solution.value.denominator).toBe(1n);
      expect(Number(solution.value.numerator)).toBeGreaterThanOrEqual(-9);
      expect(Number(solution.value.numerator)).toBeLessThanOrEqual(9);
      expect(checkStep(problem.equation, `${problem.variable}=${solution.value.numerator}`)).toMatchObject({ verdict: "correct", mistakeKind: "none", isComplete: true });
      equations.add(problem.equation); variables.add(problem.variable); difficulties.add(problem.difficulty);
      if (problem.difficulty !== "Challenge") positiveVariants++;
    }
    expect(equations.size).toBe(100); expect(variables.size).toBe(2); expect(difficulties.size).toBe(3);
    expect(positiveVariants).toBeGreaterThan(60);
  });
  it("avoids repeats even with a constant random source and handles edge seeds", () => {
    const refs: ProblemRef[] = [];
    for (let n = 0; n < 100; n++) refs.push(generateProblem(refs, () => 0));
    expect(new Set(refs.map(ref => resolveProblem(ref).equation)).size).toBe(100);
    expect(resolveProblem({ kind: "generated", seed: PROBLEM_COUNT - 1 }).source).toBe("generated");
    for (const seed of [-1, PROBLEM_COUNT, 0.5, NaN]) expect(() => resolveProblem({ kind: "generated", seed })).toThrow();
    expect(() => generateProblem([], () => 1)).toThrow();
  });
  it("recomputes generated-problem math in checker and tutor boundaries", async () => {
    const problem: ProblemRef = { kind: "generated", seed: 0 };
    const request = (equation: string, ref: unknown = problem) => POST(new Request("http://localhost/api/check-step", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problem: ref, acceptedSteps: [], equation }) }));
    expect((await (await request("x=1")).json()).result).toMatchObject({ verdict: "correct", isComplete: true });
    expect((await (await request("x=7")).json()).result.verdict).toBe("incorrect");
    const context = teachingContext({ problem, history: [], transcript: [], action: { id: crypto.randomUUID(), kind: "submit_step", equation: "2x+1=x+3" } });
    expect(context.result).toMatchObject({ verdict: "incorrect", mistakeKind: "distribution" });
    expect(context.currentEquation).toBe(resolveProblem(problem).equation);
    expect(JSON.parse(tutorInput({ problem, history: [], transcript: [], action: { id: crypto.randomUUID(), kind: "request_hint" } }, context)).serverFacts.originalProblem).toBe(resolveProblem(problem).equation);
    expect((await request("x=1", { ...problem, equation: "x=1" })).status).toBe(400);
    expect((await request("x=1", { kind: "generated", seed: PROBLEM_COUNT })).status).toBe(400);
  });
});
