import { z } from "zod";
import { PublicCheckResult, type StepFeedback } from "@/lib/math/contracts";
import { checkStep } from "@/lib/math/verifier";
import { ProblemRef, resolveProblem, STARTER_REF } from "@/lib/practice/problems";
import { ChatMessage, MAX_TUTOR_ACTIONS, TutorAction } from "@/lib/tutor/contracts";
import { teachingContext } from "@/lib/tutor/policy";
import { LearningEvent, MistakeKind } from "./events";

export const STORAGE_KEY = "mathtutor.learning.v1";
export const MAX_SAVED_BYTES = 4_000_000;
const Origin = z.object({ sourceId: z.string().min(1).max(80), mistakeKind: MistakeKind }).strict();
export const SavedSession = z.object({
  runId: z.string().min(1).max(80),
  problem: ProblemRef, origin: Origin.optional(),
  history: z.array(TutorAction).max(MAX_TUTOR_ACTIONS),
  messages: z.array(ChatMessage).max(128),
  draft: z.string().max(256), chatDraft: z.string().max(800),
}).strict().superRefine((session, context) => {
  if (new Set(session.history.map(action => action.id)).size !== session.history.length) context.addIssue({ code: "custom", message: "Duplicate actions." });
  try { replaySession(session); } catch { context.addIssue({ code: "custom", message: "Invalid solution history." }); }
});
export type SavedSession = z.infer<typeof SavedSession>;
export const RelatedOffer = z.object({ problem: ProblemRef, sourceId: z.string().min(1).max(80), mistakeKind: MistakeKind }).strict();
export type RelatedOffer = z.infer<typeof RelatedOffer>;
export const LearningData = z.object({
  version: z.literal(1), study: SavedSession, practice: SavedSession.nullable(),
  related: RelatedOffer.nullable(), seen: z.array(ProblemRef).max(20_000),
  events: z.array(LearningEvent).max(20_000),
}).strict();
export type LearningData = z.infer<typeof LearningData>;

export function emptySession(problem: ProblemRef = STARTER_REF, origin?: z.infer<typeof Origin>): SavedSession {
  return { runId: crypto.randomUUID(), problem, ...(origin ? { origin } : {}), history: [], messages: [], draft: "", chatDraft: "" };
}
export function emptyLearning(): LearningData {
  return { version: 1, study: emptySession(), practice: null, related: null, seen: [STARTER_REF], events: [] };
}

// Persist raw actions; reconstruct accepted equations and feedback independently.
export function replaySession(session: { problem: ProblemRef; history: TutorAction[] }) {
  const acceptedSteps: string[] = [];
  let current = resolveProblem(session.problem).equation;
  let feedback: StepFeedback | null = null;
  for (const action of session.history) {
    if (action.kind !== "submit_step") continue;
    if (feedback?.isComplete) throw new Error("Cannot submit after completion.");
    feedback = PublicCheckResult.parse(checkStep(current, action.equation));
    if (feedback.canAdvance) { acceptedSteps.push(action.equation); current = action.equation; }
  }
  const last = session.history.at(-1);
  const state = last ? teachingContext({ problem: session.problem, history: session.history.slice(0, -1), action: last, transcript: [] }).state
    : { phase: "awaiting_step" as const, hintLevel: 0, acceptedSteps: 0 };
  return { acceptedSteps, feedback, state, current };
}

export type LoadResult = { data: LearningData; warning: string | null; writable: boolean };
export function loadLearning(storage: Pick<Storage, "getItem">): LoadResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: emptyLearning(), warning: null, writable: true };
    if (raw.length > MAX_SAVED_BYTES) throw new Error("Oversized saved data.");
    const value: unknown = JSON.parse(raw);
    const data = LearningData.safeParse(value);
    if (!data.success) return { data: emptyLearning(), warning: "Saved history could not be read. The original data has been kept. Clear saved history to start a new record.", writable: false };
    return { data: data.data, warning: null, writable: true };
  } catch {
    return { data: emptyLearning(), warning: "Browser storage is unavailable or unreadable. Your work is available in this tab, but may not survive a refresh.", writable: false };
  }
}

export function saveLearning(storage: Pick<Storage, "setItem">, data: LearningData): boolean {
  try {
    const value = JSON.stringify(LearningData.parse(data));
    if (value.length > MAX_SAVED_BYTES) return false;
    storage.setItem(STORAGE_KEY, value); return true;
  } catch { return false; }
}
