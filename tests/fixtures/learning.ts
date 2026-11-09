import { emptyLearning, emptySession, LearningData, type SavedSession } from "../../src/lib/learning/storage";
import { mergeEvents, stepEvents } from "../../src/lib/learning/events";
import { resolveProblem } from "../../src/lib/practice/problems";
import { checkStep } from "../../src/lib/math/verifier";
import { PublicCheckResult } from "../../src/lib/math/contracts";
import { MAX_TUTOR_ACTIONS } from "../../src/lib/tutor/contracts";

// Disposable browser fixture built from real checked actions, never app data.
export function populatedLearning(): LearningData {
  const data = emptyLearning();
  const problem = { kind: "generated" as const, seed: 0 };
  data.practice = emptySession(problem, { sourceId: "starter", mistakeKind: "distribution" });
  data.related = { problem, sourceId: "starter", mistakeKind: "distribution" };
  data.seen.push(problem);
  let index = 0;
  function append(session: SavedSession, equations: string[]) {
    const original = resolveProblem(session.problem);
    let current = original.equation;
    for (const equation of equations) {
      const id = `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
      const result = PublicCheckResult.parse(checkStep(current, equation));
      session.history.push({ id, kind: "submit_step", equation });
      session.messages.push({ id, role: "student", text: equation, equation });
      data.events = mergeEvents(data.events, stepEvents(original.id, id, result, data.events, session.origin, "2026-11-09T10:00:00.000Z"));
      if (result.canAdvance) current = equation;
    }
  }
  append(data.study, ["3x+4=2x+19", "3x+12=2x+19", "x+12=19", "x=7"]);
  append(data.practice, ["2x+2=x+3"]);
  return LearningData.parse(data);
}

export function limitedLearning(): LearningData {
  const data = emptyLearning();
  const original = resolveProblem(data.study.problem);
  const equation = "3x+4=2x+19";
  const result = PublicCheckResult.parse(checkStep(original.equation, equation));
  for (let index = 0; index < MAX_TUTOR_ACTIONS; index++) {
    const id = `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
    data.study.history.push({ id, kind: "submit_step", equation });
    data.study.messages.push({ id, role: "student", text: equation, equation });
    data.events = mergeEvents(data.events, stepEvents(original.id, id, result, data.events, undefined, "2026-11-09T10:00:00.000Z"));
  }
  return LearningData.parse(data);
}
