"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { emptyLearning, emptySession, loadLearning, saveLearning, STORAGE_KEY, type LearningData, type SavedSession } from "@/lib/learning/storage";
import { generateProblem } from "@/lib/practice/problems";

export type SessionScope = "study" | "practice";
function useLearningState() {
  const [data, setData] = useState<LearningData>(emptyLearning);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const writable = useRef(false);

  useEffect(() => {
    let canceled = false;
    void Promise.resolve().then(() => {
      if (canceled) return;
      let loaded;
      try { loaded = loadLearning(window.localStorage); }
      catch { loaded = { data: emptyLearning(), writable: false, warning: "Browser storage is unavailable. Your work will stay in this tab only." }; }
      writable.current = loaded.writable;
      setData(loaded.data); setWarning(loaded.warning); setReady(true);
    });
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      writable.current = false;
      setWarning("Saved history changed in another tab. Reload this tab before continuing to save progress.");
    }
    window.addEventListener("storage", onStorage);
    return () => { canceled = true; window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    if (!ready || !writable.current) return;
    let saved = false;
    try { saved = saveLearning(window.localStorage, data); } catch { /* Browser storage can be blocked. */ }
    if (!saved) void Promise.resolve().then(() => setWarning("Your latest work could not be saved. Keep this tab open; a refresh may lose recent changes."));
  }, [data, ready]);

  function updateSession(scope: SessionScope, runId: string, update: (session: SavedSession, data: LearningData) => LearningData) {
    setData(previous => {
      const session = previous[scope];
      return session?.runId === runId ? update(session, previous) : previous;
    });
  }

  function startPractice(related = false) {
    if (!ready) return;
    const offer = related ? data.related : null;
    if (offer && data.practice && JSON.stringify(data.practice.problem) === JSON.stringify(offer.problem)) return;
    const problem = offer?.problem ?? generateProblem(data.seen);
    const practice = emptySession(problem, offer ? { sourceId: offer.sourceId, mistakeKind: offer.mistakeKind } : undefined);
    setData(previous => ({ ...previous, practice, seen: previous.seen.some(ref => JSON.stringify(ref) === JSON.stringify(problem)) ? previous.seen : [...previous.seen, problem] }));
  }

  function clearHistory() {
    let available = true;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { available = false; }
    writable.current = available;
    setData(emptyLearning());
    setWarning(available ? null : "Saved history could not be removed from browser storage. This tab has been reset.");
  }

  return { data, ready, warning, updateSession, startPractice, clearHistory };
}
const LearningContext = createContext<ReturnType<typeof useLearningState> | null>(null);
export function LearningProvider({ children }: { children: ReactNode }) {
  const value = useLearningState();
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}
export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error("LearningProvider is required");
  return value;
}
export function StorageNotice() {
  const { warning } = useLearning();
  return warning ? <p className="storage-notice" role="status">{warning}</p> : null;
}
