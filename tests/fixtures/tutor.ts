import { randomUUID } from "node:crypto";
import type { TutorAction, TutorReply, TutorRequest } from "@/lib/tutor/contracts";
import type { TeachingContext } from "@/lib/tutor/policy";

// Deterministic provider fixtures are imported by tests only, never runtime code.
export function fixtureReply(context: TeachingContext): TutorReply {
  return {
    message: context.state.phase === "completed" ? "Take a moment to reflect on the operations you chose."
      : context.state.hintLevel >= 2 ? "Use the checked example to examine the operation, then continue with your reasoning."
        : context.state.hintLevel === 1 ? "Use the distributive property to apply the outside factor to each term."
        : "Think about how the outside factor acts on the terms inside the brackets.",
    guidingQuestion: context.state.phase === "completed" ? null : "Which terms receive the outside factor?",
    hintLevel: context.state.hintLevel,
    mathFocus: context.example ? "worked_example" : "none",
    suggestedNextAction: context.nextAction,
  };
}
export const stepAction = (equation: string): TutorAction => ({ id: randomUUID(), kind: "submit_step", equation });
export const hintAction = (): TutorAction => ({ id: randomUUID(), kind: "request_hint" });
export const questionAction = (question = "Why must I multiply both terms?"): TutorAction => ({ id: randomUUID(), kind: "ask_question", question });
export const tutorRequest = (action: TutorAction, history: TutorAction[] = []): TutorRequest => ({ action, history, transcript: [] });
