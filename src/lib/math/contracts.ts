import { z } from "zod";
import { MAX_EQUATION_LENGTH } from "./parser";

export const MAX_ACCEPTED_STEPS = 48;
export const CheckStepRequest = z.object({
  acceptedSteps: z.array(z.string().min(1).max(MAX_EQUATION_LENGTH)).max(MAX_ACCEPTED_STEPS),
  equation: z.string().max(MAX_EQUATION_LENGTH),
}).strict();

export const PublicCheckResult = z.object({
  parseStatus: z.enum(["valid", "invalid", "unsupported"]),
  verdict: z.enum(["correct", "incorrect", "unchanged", "uncertain"]),
  mistakeKind: z.enum(["distribution", "combine_like_terms", "sign_or_balance", "arithmetic", "unsupported_step", "none"]),
  previousEquation: z.string(),
  submittedEquation: z.string(),
  canAdvance: z.boolean(),
  isComplete: z.boolean(),
  stage: z.enum(["expand", "combine", "isolate", "check"]),
  title: z.string(),
  message: z.string(),
});

export const CheckStepResponse = z.object({ result: PublicCheckResult });
export type StepFeedback = z.infer<typeof PublicCheckResult>;
