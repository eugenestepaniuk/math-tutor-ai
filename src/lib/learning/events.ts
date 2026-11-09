import { z } from "zod";
import { type StepFeedback } from "@/lib/math/contracts";

export const MistakeKind = z.enum(["distribution", "combine_like_terms", "sign_or_balance", "arithmetic", "unsupported_step"]);
export type MistakeKind = z.infer<typeof MistakeKind>;
export const LearningEvent = z.object({
  id: z.string().min(1).max(160), problemId: z.string().min(1).max(80),
  kind: z.enum(["attempt", "mistake", "step_accepted", "mistake_corrected", "problem_completed", "hint_used", "followup_completed"]),
  skill: z.literal("distributive_property"), createdAt: z.string().datetime(),
  isFollowup: z.boolean(), correct: z.boolean().optional(), graded: z.boolean().optional(),
  mistakeKind: MistakeKind.optional(),
}).strict();
export type LearningEvent = z.infer<typeof LearningEvent>;
export type FollowupOrigin = { sourceId: string; mistakeKind: MistakeKind };

export function mergeEvents(previous: readonly LearningEvent[], incoming: readonly LearningEvent[]): LearningEvent[] {
  const ids = new Set(previous.map(event => event.id));
  return [...previous, ...incoming.filter(event => {
    if (ids.has(event.id)) return false;
    ids.add(event.id); return true;
  })];
}

export function stepEvents(problemId: string, actionId: string, result: StepFeedback, previous: readonly LearningEvent[], origin?: FollowupOrigin, createdAt = new Date().toISOString()): LearningEvent[] {
  const base = { problemId, skill: "distributive_property" as const, createdAt, isFollowup: !!origin };
  const events: LearningEvent[] = [{ ...base, id: `${actionId}:attempt`, kind: "attempt", correct: result.canAdvance, graded: result.verdict === "correct" || result.verdict === "incorrect" }];
  if (result.verdict === "incorrect" && result.mistakeKind !== "none") events.push({ ...base, id: `${actionId}:mistake`, kind: "mistake", mistakeKind: result.mistakeKind });
  if (result.canAdvance) {
    events.push({ ...base, id: `${actionId}:accepted`, kind: "step_accepted" });
    const pending = new Set<MistakeKind>();
    for (const event of previous.filter(event => event.problemId === problemId)) {
      if (event.kind === "mistake" && event.mistakeKind) pending.add(event.mistakeKind);
      if (event.kind === "mistake_corrected" && event.mistakeKind) pending.delete(event.mistakeKind);
    }
    for (const mistakeKind of pending) {
      if (mistakeKind === "distribution" && result.stage === "expand") continue;
      events.push({ ...base, id: `${actionId}:corrected:${mistakeKind}`, kind: "mistake_corrected", mistakeKind });
    }
    if (result.isComplete) {
      events.push({ ...base, id: `${problemId}:completed`, kind: "problem_completed" });
      if (origin) events.push({ ...base, id: `${problemId}:followup`, kind: "followup_completed", correct: !previous.some(event => event.problemId === problemId && event.kind === "mistake" && event.mistakeKind === origin.mistakeKind) });
    }
  }
  return events;
}

export function learningStats(events: readonly LearningEvent[]) {
  const unique = mergeEvents([], events);
  const count = (kind: LearningEvent["kind"]) => unique.filter(event => event.kind === kind).length;
  const attempts = unique.filter(event => event.kind === "attempt");
  const graded = attempts.filter(event => event.graded);
  const followups = new Set(attempts.filter(event => event.isFollowup).map(event => event.problemId)).size;
  const completedFollowups = unique.filter(event => event.kind === "followup_completed");
  const passedFollowups = completedFollowups.filter(event => event.correct).length;
  const categories = Object.fromEntries(MistakeKind.options.map(kind => [kind, unique.filter(event => event.kind === "mistake" && event.mistakeKind === kind).length])) as Record<MistakeKind, number>;
  return {
    completed: new Set(unique.filter(event => event.kind === "problem_completed").map(event => event.problemId)).size,
    attempts: attempts.length, accepted: count("step_accepted"), mistakes: count("mistake"), corrected: count("mistake_corrected"), hints: count("hint_used"),
    practiceAccuracy: graded.length ? Math.round(100 * graded.filter(event => event.correct).length / graded.length) : null,
    followups, completedFollowups: completedFollowups.length, passedFollowups,
    followupAccuracy: followups ? Math.round(100 * passedFollowups / followups) : null,
    categories,
  };
}
