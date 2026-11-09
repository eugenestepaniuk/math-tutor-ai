import { PublicCheckResult, type StepFeedback } from "@/lib/math/contracts";
import { checkStep } from "@/lib/math/verifier";
import { resolveProblem, STARTER_REF } from "@/lib/practice/problems";
import { RequestError } from "@/lib/server/http";
import { type TeachingState, type TutorRequest, TutorReply } from "./contracts";
import { verifiedExample } from "./examples";

export type TeachingContext = {
  currentEquation: string;
  state: TeachingState;
  result: StepFeedback | null;
  lastCheck: StepFeedback | null;
  recentAttempts: { equation: string; verdict: string; mistakeKind: string }[];
  priorMistakes: string[];
  question: string | null;
  example: string | null;
  nextAction: "retry_step" | "continue_solution" | "ask_clarification" | "review_solution";
};

export function teachingContext(request: TutorRequest): TeachingContext {
  let current = resolveProblem(request.problem ?? STARTER_REF).equation;
  const state: TeachingState = { phase: "awaiting_step", hintLevel: 0, acceptedSteps: 0 };
  let lastCheck: StepFeedback | null = null;
  let repeatedMistakes = 0;
  const recentAttempts: TeachingContext["recentAttempts"] = [];
  const priorMistakes: string[] = [];

  for (const action of [...request.history, request.action]) {
    if (action.kind === "submit_step") {
      if (state.phase === "completed") throw new RequestError(409, "This equation is already solved. Start again to check more steps.");
      lastCheck = PublicCheckResult.parse(checkStep(current, action.equation));
      recentAttempts.push({ equation: action.equation, verdict: lastCheck.verdict, mistakeKind: lastCheck.mistakeKind });
      if (lastCheck.canAdvance) {
        state.acceptedSteps++;
        if (state.acceptedSteps > 48) throw new RequestError(409, "This solution has reached its step limit. Start again to continue.");
        current = action.equation;
        state.phase = lastCheck.isComplete ? "completed" : "next_step";
        state.hintLevel = 0;
        repeatedMistakes = 0;
      } else if (lastCheck.verdict === "incorrect") {
        priorMistakes.push(lastCheck.mistakeKind);
        state.phase = "guided_correction";
        repeatedMistakes++;
        state.hintLevel = Math.max(state.hintLevel, Math.min(1, repeatedMistakes - 1));
      }
    } else if (action.kind === "request_hint") {
      state.hintLevel = state.phase === "completed" ? 3 : Math.min(3, state.hintLevel + 1);
    }
  }

  const nextAction = state.phase === "completed" ? "review_solution"
    : state.phase === "guided_correction" ? "retry_step"
      : state.phase === "next_step" ? "continue_solution" : "ask_clarification";
  return {
    currentEquation: current, state,
    result: request.action.kind === "submit_step" ? lastCheck : null,
    lastCheck, recentAttempts: recentAttempts.slice(-4), priorMistakes: priorMistakes.slice(-8),
    question: request.action.kind === "ask_question" ? request.action.question : null,
    example: state.phase === "completed" ? null : verifiedExample(current, state.hintLevel),
    nextAction,
  };
}

// Grading and displayed formulas never come from the model. Prose is additionally
// screened conservatively; this is a heuristic guard, not a proof of all language.
export function tutorReplyIssue(value: unknown, context: TeachingContext): string | null {
  const parsed = TutorReply.safeParse(value);
  if (!parsed.success) return "schema";
  const reply = parsed.data;
  if (reply.hintLevel !== context.state.hintLevel || reply.suggestedNextAction !== context.nextAction) return "state_mismatch";
  if (reply.mathFocus !== (context.example ? "worked_example" : "none")) return "example_mismatch";
  const prose = `${reply.message} ${reply.guidingQuestion ?? ""}`;
  if (/[\p{N}=+*/\\^×÷−<>]/u.test(prose)) return "formula_in_prose";
  // Generic counts describe the structure, not a calculated value. Without
  // this distinction even "two terms" rejects otherwise useful guidance.
  const valueProse = prose
    .replace(/\b(?:one|two)\s+(?:terms?|sides?|brackets?|factors?|steps?|operations?|products?|multiplications?|parts?|groups?)\b/gi, "structural reference")
    .replace(/\b(?:one at a time|one by one|(?:each|either|another|other|the) one|one of the (?:terms|sides|products|parts))\b/gi, "structural reference");
  const numberWord = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|half|quarter|double|triple|dozen)\b/i.exec(valueProse);
  if (numberWord) return `number_word_${numberWord[1]!.toLowerCase()}`;
  if (/\b(correct|incorrect|wrong|valid|invalid|solved|equivalent|equivalence|equals)\b/i.test(prose)) return "grading_claim";
  if (/\b(?:you(?:'re| are)|step is)\s+(?:not\s+)?right\b/i.test(prose)) return "grading_claim";
  if (/\b(?:answer|solution)\s+(?:is|was|must|should)\b/i.test(prose)) return "answer_claim";
  if (/\bonly\s+(?:the\s+)?(?:first|variable)|\bignore\s+(?:the\s+)?constant/i.test(prose)) return "contradictory_distribution";
  if (/\bonly(?:\s+\w+){0,4}\s+(?:first|variable)\s+term/i.test(prose)) return "contradictory_distribution";
  if (/\bconstant\b.{0,30}\b(?:stays?|remains?|is)\b.{0,15}\b(?:unchanged|unaffected)\b/i.test(prose)) return "contradictory_distribution";
  const distributionClaim = /\byou\b.*\b(?:applied|multiplied|distributed)\b.*\b(?:every|each|both|all)\b.*\bterms?\b/i;
  const question = reply.guidingQuestion ?? "";
  // A targeted question ("Have you multiplied each term ...?") is not a claim
  // that an incorrect attempt already applied distribution to every term.
  const presupposedClaim = /^(?:you\b|(?:since|because|now that|after)\s+you\b)/i.test(question)
    && distributionClaim.test(question);
  if (context.state.phase === "guided_correction" && context.priorMistakes.at(-1) === "distribution"
    && (distributionClaim.test(reply.message) || presupposedClaim)) return "contradictory_distribution";
  if (reply.message.includes("?")) return "question_in_message";
  if (context.state.phase !== "completed" && !reply.guidingQuestion?.endsWith("?")) return "missing_question";
  if (reply.guidingQuestion && (reply.guidingQuestion.match(/\?/g)?.length ?? 0) !== 1) return "multiple_questions";
  return null;
}

export function safeTutorReply(value: unknown, context: TeachingContext): ReturnType<typeof TutorReply.parse> | null {
  return tutorReplyIssue(value, context) ? null : TutorReply.parse(value);
}
