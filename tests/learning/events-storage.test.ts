import { describe, expect, it } from "vitest";
import { learningStats, mergeEvents, stepEvents } from "@/lib/learning/events";
import { emptyLearning, emptySession, loadLearning, replaySession, saveLearning, type LearningData } from "@/lib/learning/storage";
import { PublicCheckResult } from "@/lib/math/contracts";
import { checkStep, STARTER_EQUATION } from "@/lib/math/verifier";

const checked = (equation: string) => PublicCheckResult.parse(checkStep(STARTER_EQUATION, equation));
describe("deduplicated learning events", () => {
  it("counts actual attempts, mistakes, corrections and unique completions", () => {
    let events = stepEvents("starter", "a", checked("3x+4=2x+19"), []);
    events = mergeEvents(events, stepEvents("starter", "b", checked("3x+12=2x+19"), events));
    const completed = stepEvents("starter", "c", checked("x=7"), events);
    events = mergeEvents(events, completed); events = mergeEvents(events, completed);
    expect(learningStats(events)).toMatchObject({ completed: 1, attempts: 3, mistakes: 1, corrected: 1, accepted: 2, practiceAccuracy: 67, followupAccuracy: null });
    expect(learningStats(mergeEvents(events, stepEvents("starter", "d", checked("x=7"), events))).completed).toBe(1);
  });
  it("syntax and no-op submissions do not become misconceptions or graded failures", () => {
    const events = [...stepEvents("starter", "a", checked("3x+="), []), ...stepEvents("starter", "b", checked(STARTER_EQUATION), [])];
    expect(learningStats(events)).toMatchObject({ attempts: 2, mistakes: 0, corrected: 0, practiceAccuracy: null });
  });
  it("keeps distribution unresolved while an accepted step still needs expansion", () => {
    const events = stepEvents("starter", "a", checked("3x+4=2x+19"), []);
    const rearranged = stepEvents("starter", "b", checked("3(x+4)-2x=19"), events);
    expect(learningStats(mergeEvents(events, rearranged))).toMatchObject({ accepted: 1, corrected: 0 });
  });
  it("records transfer success only after completion without the target mistake", () => {
    const origin = { sourceId: "prior", mistakeKind: "distribution" as const };
    let events = stepEvents("related", "a", checked("3x+12=2x+19"), [], origin);
    expect(learningStats(events)).toMatchObject({ followups: 1, passedFollowups: 0, completedFollowups: 0 });
    events = mergeEvents(events, stepEvents("related", "b", checked("x=7"), events, origin));
    expect(learningStats(events)).toMatchObject({ followupAccuracy: 100, passedFollowups: 1, completedFollowups: 1 });
    let retried = stepEvents("related", "c", checked("3x+4=2x+19"), [], origin);
    retried = mergeEvents(retried, stepEvents("related", "d", checked("x=7"), retried, origin));
    expect(learningStats(retried)).toMatchObject({ completed: 1, followupAccuracy: 0, passedFollowups: 0, completedFollowups: 1 });
  });
});

describe("versioned anonymous storage", () => {
  function storage(initial: string | null = null) {
    let value = initial;
    return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
  }
  it("starts empty, restores independent math, drafts, chat and events without a model call", () => {
    const saved = storage();
    const data = emptyLearning();
    data.study.draft = "x+12=19"; data.study.chatDraft = "Why balance both sides?";
    data.study.history = ["3x+4=2x+19", "3x+12=2x+19"].map(equation => ({ id: crypto.randomUUID(), kind: "submit_step", equation }));
    data.study.messages = [{ id: "saved", role: "tutor", text: "Consider the outside factor." }];
    data.events = stepEvents("starter", "a", checked("3x+4=2x+19"), []);
    expect(learningStats(loadLearning(saved).data.events).attempts).toBe(0);
    expect(saveLearning(saved, data)).toBe(true);
    const loaded = loadLearning(saved);
    expect(loaded.warning).toBeNull(); expect(loaded.data).toEqual(data);
    expect(replaySession(loaded.data.study)).toMatchObject({ acceptedSteps: ["3x+12=2x+19"], feedback: { verdict: "correct" }, state: { phase: "next_step" } });
  });
  it.each(["{broken", JSON.stringify({ ...emptyLearning(), version: 2 }), JSON.stringify({ version: 1 })])("preserves unreadable/unknown-version data", raw => {
    const saved = storage(raw);
    expect(loadLearning(saved)).toMatchObject({ writable: false, warning: expect.any(String) });
    expect(saved.getItem()).toBe(raw);
  });
  it("rejects forged accepted histories, duplicate actions and out-of-bounds problems", () => {
    const data = emptyLearning();
    const action = { id: crypto.randomUUID(), kind: "submit_step" as const, equation: "x=7" };
    data.study.history = [action, { ...action, id: crypto.randomUUID() }];
    expect(loadLearning(storage(JSON.stringify(data))).writable).toBe(false);
    data.study.history = [action, action];
    expect(saveLearning(storage(), data)).toBe(false);
    expect(() => replaySession({ ...emptySession(), problem: { kind: "generated", seed: -1 } })).toThrow();
  });
  it("reports blocked reads and quota failures rather than claiming persistence", () => {
    expect(loadLearning({ getItem() { throw new Error("blocked"); } }).writable).toBe(false);
    expect(saveLearning({ setItem() { throw new Error("quota"); } }, emptyLearning())).toBe(false);
    expect(saveLearning(storage(), { ...emptyLearning(), events: new Array(20_001).fill({}) } as LearningData)).toBe(false);
  });
});
