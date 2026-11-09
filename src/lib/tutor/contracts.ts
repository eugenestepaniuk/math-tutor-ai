import { z } from "zod";
import { PublicCheckResult } from "@/lib/math/contracts";
import { MAX_EQUATION_LENGTH } from "@/lib/math/parser";

export const MAX_TUTOR_ACTIONS = 64;
const id = z.string().uuid();
export const TutorAction = z.discriminatedUnion("kind", [
  z.object({ id, kind: z.literal("submit_step"), equation: z.string().max(MAX_EQUATION_LENGTH) }).strict(),
  z.object({ id, kind: z.literal("request_hint") }).strict(),
  z.object({ id, kind: z.literal("ask_question"), question: z.string().trim().min(1).max(800) }).strict(),
]);
export type TutorAction = z.infer<typeof TutorAction>;

export const TutorRequest = z.object({
  history: z.array(TutorAction).max(MAX_TUTOR_ACTIONS - 1),
  action: TutorAction,
  transcript: z.array(z.object({ role: z.enum(["student", "tutor"]), text: z.string().max(900) }).strict()).max(8),
}).strict().superRefine((value, context) => {
  const ids = [...value.history, value.action].map(action => action.id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "Action IDs must be unique." });
});
export type TutorRequest = z.infer<typeof TutorRequest>;

export const TutorReply = z.object({
  message: z.string().trim().min(1).max(600),
  guidingQuestion: z.string().trim().min(1).max(240).nullable(),
  hintLevel: z.number().int().min(0).max(3),
  mathFocus: z.enum(["none", "worked_example"]),
  suggestedNextAction: z.enum(["retry_step", "continue_solution", "ask_clarification", "review_solution"]),
}).strict();
export type TutorReply = z.infer<typeof TutorReply>;

export const TeachingState = z.object({
  phase: z.enum(["awaiting_step", "guided_correction", "next_step", "completed"]),
  hintLevel: z.number().int().min(0).max(3),
  acceptedSteps: z.number().int().min(0).max(48),
});
export type TeachingState = z.infer<typeof TeachingState>;

export const TutorErrorCode = z.enum(["disabled", "not_configured", "timeout", "provider_limit", "provider_error", "invalid_guidance", "request_limit"]);
export type TutorErrorCode = z.infer<typeof TutorErrorCode>;

export const TutorResponse = z.object({
  result: PublicCheckResult.nullable(),
  state: TeachingState,
  tutor: z.object({
    status: z.enum(["ready", "unavailable", "guarded"]),
    source: z.enum(["model", "checker"]).nullable(),
    message: z.string().nullable(),
    guidingQuestion: z.string().nullable(),
    mathExample: z.string().nullable(),
    errorCode: TutorErrorCode.nullable(),
    retryable: z.boolean(),
  }),
});
export type TutorResponse = z.infer<typeof TutorResponse>;
export const TutorAvailability = z.object({ enabled: z.boolean(), configured: z.boolean() });

export type ChatMessage = {
  id: string;
  role: "student" | "tutor" | "checker";
  text: string;
  equation?: string;
  guidingQuestion?: string | null;
};
