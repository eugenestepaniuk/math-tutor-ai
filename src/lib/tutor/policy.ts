import { PublicCheckResult, type StepFeedback } from "@/lib/math/contracts";
import { checkStep, STARTER_EQUATION } from "@/lib/math/verifier";
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
  let current = STARTER_EQUATION;
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
export function safeTutorReply(value: unknown, context: TeachingContext): ReturnType<typeof TutorReply.parse> | null {
  const parsed = TutorReply.safeParse(value);
  if (!parsed.success) return null;
  const reply = parsed.data;
  if (reply.hintLevel !== context.state.hintLevel || reply.suggestedNextAction !== context.nextAction) return null;
  if (reply.mathFocus !== (context.example ? "worked_example" : "none")) return null;
  const prose = `${reply.message} ${reply.guidingQuestion ?? ""}`;
  if (/[\p{N}=+*/\\^×÷−<>]/u.test(prose)) return null;
  if (/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|half|quarter|double|triple|dozen)\b/i.test(prose)) return null;
  if (/\b(correct|incorrect|wrong|valid|invalid|solved|equivalent|equivalence|equals)\b/i.test(prose)) return null;
  if (/\b(?:you(?:'re| are)|step is)\s+(?:not\s+)?right\b/i.test(prose)) return null;
  if (/\b(?:answer|solution)\s+(?:is|was|must|should)\b/i.test(prose)) return null;
  if (/\bonly\s+(?:the\s+)?(?:first|variable)|\bignore\s+(?:the\s+)?constant/i.test(prose)) return null;
  if (/\bonly(?:\s+\w+){0,4}\s+(?:first|variable)\s+term/i.test(prose)) return null;
  if (/\bconstant\b.{0,30}\b(?:stays?|remains?|is)\b.{0,15}\b(?:unchanged|unaffected)\b/i.test(prose)) return null;
  if (context.state.phase === "guided_correction" && context.priorMistakes.at(-1) === "distribution"
    && /\byou\b.*\b(?:applied|multiplied|distributed)\b.*\b(?:every|each|both|all)\b.*\bterms?\b/i.test(prose)) return null;
  if (reply.message.includes("?")) return null;
  if (context.state.phase !== "completed" && !reply.guidingQuestion?.endsWith("?")) return null;
  if (reply.guidingQuestion && (reply.guidingQuestion.match(/\?/g)?.length ?? 0) !== 1) return null;
  return reply;
}
