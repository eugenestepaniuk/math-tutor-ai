import { describe, expect, it } from "vitest";
import { parseEquation } from "@/lib/math/parser";
import { solveEquation } from "@/lib/math/linear";
import { formatRational } from "@/lib/math/rational";
import { checkStep, STARTER_EQUATION as starter } from "@/lib/math/verifier";
import { equationToTex } from "@/lib/math/format";

const verdict = (before: string, after: string, result: string, mistake = "none") => {
  const checked = checkStep(before, after);
  expect(checked.verdict).toBe(result);
  expect(checked.mistakeKind).toBe(mistake);
  return checked;
};

describe("reference acceptance M01–M11", () => {
  it("M01 independently solves the starter", () => {
    expect(solveEquation(parseEquation(starter))).toEqual({ kind: "unique", value: { numerator: 7n, denominator: 1n } });
  });
  it("M02 detects omitted distribution without revealing the corrected step", () => {
    const result = verdict(starter, "3x + 4 = 2x + 19", "incorrect", "distribution");
    expect(result.message).not.toContain("12");
    expect(result.message).not.toContain("7");
    expect(result.canAdvance).toBe(false);
  });
  it("M03–M05 accept the correction and complete only the isolated value", () => {
    expect(verdict(starter, "3x + 12 = 2x + 19", "correct").isComplete).toBe(false);
    expect(verdict("3x + 12 = 2x + 19", "x + 12 = 19", "correct").stage).toBe("isolate");
    expect(verdict("x+12=19", "x=7", "correct").isComplete).toBe(true);
  });
  it("M06 accepts alternative equivalent transformations", () => {
    verdict("3x+12=2x+19", "3x-2x=19-12", "correct");
  });
  it("M07 accepts a valid jump and a reversed final equation", () => {
    const jump = verdict(starter, "x=7", "correct");
    expect(jump.isComplete).toBe(true);
    expect(jump.message).toContain("expanded the brackets");
    expect(verdict(starter, "7=x", "correct").isComplete).toBe(true);
  });
  it("M08 no-op is not a misconception", () => {
    expect(verdict(starter, " 3 * (x+4) = 2*x+19 ", "unchanged").canAdvance).toBe(false);
  });
  it("M09 syntax failure is not a mathematical error", () => {
    expect(verdict(starter, "3x + = 2x + 19", "uncertain").parseStatus).toBe("invalid");
  });
  it("M10–M11 independently check the follow-up fixture (not a generator)", () => {
    expect(solveEquation(parseEquation("5(y+2)=3y+18"))).toEqual({ kind: "unique", value: { numerator: 4n, denominator: 1n } });
    verdict("5(y+2)=3y+18", "5y+10=3y+18", "correct");
  });
});

describe("generalized evidence-based classification", () => {
  it.each([
    ["5(y+2)=3y+18", "5y+2=3y+18"],
    ["4(2x-3)=x+9", "8x-3=x+9"],
    ["-2(x+5)=3x+10", "-2x+5=3x+10"],
    ["x+9=(2x-3)*4", "x+9=8x-3"],
    ["2+3(x+4)=2x+21", "2+3x+4=2x+21"],
  ])("recognizes distribution in %s", (before, after) => { verdict(before, after, "incorrect", "distribution"); });
  it("does not infer distribution solely from an affine coincidence", () => {
    verdict(starter, "3(x+4/3)=2x+19", "incorrect", "unsupported_step");
  });
  it("M16 rejects plausible but unsupported transformations without guessing", () => {
    verdict("3x+12=2x+19", "x+12=18", "incorrect", "unsupported_step");
    verdict(starter, "3x+13=2x+19", "incorrect", "unsupported_step");
  });
  it("checks 100 coefficient-based expansion fixtures", () => {
    for (let n = 1; n <= 100; n++) {
      const a = n % 8 + 2;
      const b = n % 7 + 1;
      const c = a - 1;
      const d = a * b + n % 9;
      verdict(`${a}(x+${b})=${c}x+${d}`, `${a}x+${a*b}=${c}x+${d}`, "correct");
      verdict(`${a}(x+${b})=${c}x+${d}`, `${a}x+${b}=${c}x+${d}`, "incorrect", "distribution");
    }
  });
});

describe("restricted grammar and exact solution sets", () => {
  it("M13 supports brackets, implicit multiplication and unicode operators", () => {
    verdict("3[x+4]=2*x+19", "3×x+12=2x+19", "correct");
    verdict("-2(x-3)=8", "x−3=8÷(-2)", "correct");
  });
  it("M15 handles negative coefficients and exact fractions", () => {
    verdict("-2(x-3)=8", "x=-1", "correct");
    const result = verdict("3x=2", "x=2/3", "correct");
    expect(result.canonicalSolution).toBe("x = 2/3");
    verdict("6x=4", "x/2=1/3", "correct");
    const solved = solveEquation(parseEquation("3x=1"));
    expect(solved.kind === "unique" && formatRational(solved.value)).toBe("1/3");
  });
  it("distinguishes unique, empty and universal solution sets", () => {
    verdict(starter, "0x=0", "incorrect", "unsupported_step");
    verdict(starter, "0=1", "incorrect", "unsupported_step");
    verdict("x=x", "0=0", "correct");
    verdict("x=x+1", "0=1", "correct");
    verdict("x=x", "0=1", "incorrect", "unsupported_step");
  });
  it.each(["alert(1)=0", "x.constructor=1", "import(x)=1", "x^2=4", "x*x=4", "x+y=2", "x/0=1", "x/x=1", "9999999999x=2", "1".repeat(257), "(".repeat(30)+"x"+")".repeat(30)+"=1", "<img src=x>=1"])("M14 safely rejects %s", (candidate) => {
    const result = verdict(starter, candidate, "uncertain");
    expect(result.canAdvance).toBe(false);
    expect(result.parseStatus).toBe("unsupported");
  });
  it.each(["", "x=", "x==1", "(x+1=3", "x+1)=3", "[x+1)=3", "2 3x=4", "x=1=2"])("rejects malformed %s", candidate => {
    expect(verdict(starter, candidate, "uncertain").parseStatus).toBe("invalid");
  });
  it("rejects changed variable and rational growth", () => {
    expect(verdict(starter, "y=7", "uncertain").parseStatus).toBe("unsupported");
    expect(verdict(starter, "999999999*999999999*999999999*x=1", "uncertain").parseStatus).toBe("unsupported");
  });
  it("formats only allowlisted math nodes", () => {
    expect(equationToTex("x=2/3")).toBe("x = \\frac{2}{3}");
    expect(equationToTex("\\href{javascript:alert(1)}{x}=1")).toBeNull();
  });
});
