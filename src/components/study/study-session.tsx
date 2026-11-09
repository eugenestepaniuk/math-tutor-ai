"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { CheckStepResponse, type StepFeedback } from "@/lib/math/contracts";
import { MAX_TUTOR_ACTIONS, TutorAvailability, TutorResponse, type ChatMessage, type TutorAction, type TutorRequest } from "@/lib/tutor/contracts";
import { emptySession, replaySession, type SavedSession } from "@/lib/learning/storage";
import { mergeEvents, stepEvents, type LearningEvent } from "@/lib/learning/events";
import { generateProblem, resolveProblem } from "@/lib/practice/problems";
import { LearningProvider, useLearning, type SessionScope } from "@/components/learning/learning-provider";

async function readAvailability(signal?: AbortSignal) {
  try {
    const response = await fetch("/api/tutor", { signal, cache: "no-store" });
    if (!response.ok) throw new Error("unavailable");
    return TutorAvailability.parse(await response.json());
  } catch { return { enabled: false, configured: false }; }
}

function useSessionState(scope: SessionScope) {
  const learning = useLearning();
  const [fallback] = useState(emptySession);
  const snapshot = learning.data[scope] ?? fallback;
  const { draft, chatDraft, history, messages } = snapshot;
  const problem = useMemo(() => resolveProblem(snapshot.problem), [snapshot.problem]);
  const { acceptedSteps, feedback, state: teachingState } = useMemo(() => replaySession(snapshot), [snapshot]);
  const [checking, setChecking] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ enabled: boolean; configured: boolean } | null>(null);
  const [connection, setConnection] = useState<"unchecked" | "online" | "error">("unchecked");
  const [tutorPending, setTutorPending] = useState(false);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<TutorRequest | null>(null);
  const mathInFlight = useRef(false);
  const tutorInFlight = useRef(false);
  const controllers = useRef(new Set<AbortController>());

  function update(change: (session: SavedSession) => SavedSession) {
    learning.updateSession(scope, snapshot.runId, (session, data) => ({ ...data, [scope]: change(session) }));
  }
  function field<K extends "draft" | "chatDraft" | "messages" | "history">(key: K): Dispatch<SetStateAction<SavedSession[K]>> {
    return value => update(session => ({ ...session, [key]: typeof value === "function" ? (value as (previous: SavedSession[K]) => SavedSession[K])(session[key]) : value }));
  }
  const setDraft = field("draft");
  const setChatDraft = field("chatDraft");
  const setMessages = field("messages");
  const setHistory = field("history");

  async function refreshAvailability() { setAvailability(await readAvailability()); }
  useEffect(() => {
    const controller = new AbortController();
    const active = controllers.current;
    void readAvailability(controller.signal).then(value => {
      if (!controller.signal.aborted) setAvailability(value);
    });
    return () => { controller.abort(); for (const request of active) request.abort(); };
  }, []);

  const tutorEnabled = learning.ready && !!availability?.enabled && !!availability.configured;
  const full = history.length >= MAX_TUTOR_ACTIONS;
  function transcript() {
    return messages.filter(message => message.role !== "checker").slice(-8).map(message => ({
      role: message.role as "student" | "tutor", text: (message.text + (message.guidingQuestion ? " " + message.guidingQuestion : "")).slice(0, 900),
    }));
  }

  function recordAction(action: TutorAction, result?: StepFeedback, deliveredHint = false) {
    const createdAt = new Date().toISOString();
    learning.updateSession(scope, snapshot.runId, (previous, data) => {
      const existed = previous.history.some(item => item.id === action.id);
      const incoming: LearningEvent[] = result && !existed
        ? stepEvents(problem.id, action.id, result, data.events, previous.origin, createdAt)
        : deliveredHint ? [{ id: `${action.id}:hint`, kind: "hint_used", problemId: problem.id, skill: "distributive_property", createdAt, isFollowup: !!previous.origin }] : [];
      const message: ChatMessage = action.kind === "submit_step"
        ? { id: action.id, role: "student", text: action.equation, equation: action.equation }
        : { id: action.id, role: "student", text: action.kind === "ask_question" ? action.question : "Hint requested" };
      let related = data.related;
      let seen = data.seen;
      if (scope === "study" && related?.sourceId !== problem.id && (incoming.some(event => event.kind === "mistake_corrected") || result?.isComplete)) {
        const next = generateProblem(data.seen);
        const mistakeKind = incoming.find(event => event.kind === "mistake_corrected")?.mistakeKind ?? "distribution";
        related = { problem: next, sourceId: problem.id, mistakeKind }; seen = [...seen, next];
      }
      return { ...data, related, seen, events: mergeEvents(data.events, incoming), [scope]: {
        ...previous,
        history: existed ? previous.history : [...previous.history, action],
        messages: previous.messages.some(item => item.id === message.id) ? previous.messages : [...previous.messages, message].slice(-128),
      } };
    });
  }

  async function requestTutor(data: TutorRequest): Promise<boolean> {
    if (tutorInFlight.current) return false;
    tutorInFlight.current = true; setTutorPending(true); setTutorError(null);
    const controller = new AbortController(); controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: controller.signal });
      if (!response.ok) throw new Error("tutor_failed");
      const payload = TutorResponse.parse(await response.json());
      if (payload.tutor.status !== "ready") {
        setConnection("error"); setTutorError(payload.tutor.message); setRetryRequest(payload.tutor.retryable ? data : null);
        if (payload.tutor.source === "checker") setMessages(previous => [...previous.filter(item => item.id !== data.action.id + "-reply"), { id: data.action.id + "-reply", role: "checker", text: payload.tutor.message ?? "Review the verified checker feedback." }].slice(-128) as ChatMessage[]);
        return false;
      }
      recordAction(data.action, undefined, data.action.kind === "request_hint");
      setConnection("online"); setRetryRequest(null);
      setMessages(previous => [...previous.filter(item => item.id !== data.action.id + "-reply"), {
        id: data.action.id + "-reply", role: "tutor", text: payload.tutor.message ?? "", guidingQuestion: payload.tutor.guidingQuestion,
        ...(payload.tutor.mathExample ? { equation: payload.tutor.mathExample } : {}),
      }].slice(-128) as ChatMessage[]);
      return true;
    } catch {
      setConnection("error"); setTutorError("The AI tutor couldn’t respond. Your message is still here; please try again."); setRetryRequest(data); return false;
    } finally { clearTimeout(timer); controllers.current.delete(controller); tutorInFlight.current = false; setTutorPending(false); }
  }

  async function submit() {
    if (!learning.ready || mathInFlight.current || tutorInFlight.current || feedback?.isComplete || full) return;
    mathInFlight.current = true; setChecking(true); setNetworkError(null); setTutorError(null); setRetryRequest(null);
    const action: TutorAction = { id: crypto.randomUUID(), kind: "submit_step", equation: draft };
    const data: TutorRequest = { problem: snapshot.problem, history, action, transcript: transcript() };
    const controller = new AbortController(); controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("/api/check-step", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: snapshot.problem, acceptedSteps, equation: draft }), signal: controller.signal,
      });
      if (!response.ok) throw new Error("check_failed");
      const result = CheckStepResponse.parse(await response.json()).result;
      recordAction(action, result);
      let guidanceReady = true;
      if (tutorEnabled && result.parseStatus === "valid" && result.verdict !== "unchanged") { setChecking(false); guidanceReady = await requestTutor(data); }
      if (result.canAdvance && guidanceReady) setDraft("");
      return result;
    } catch { setNetworkError("The checker is unavailable. Your equation is saved in this session; please try again."); }
    finally { clearTimeout(timer); controllers.current.delete(controller); mathInFlight.current = false; setChecking(false); }
  }

  async function sendQuestion() {
    if (!chatDraft.trim() || !tutorEnabled || full || mathInFlight.current || tutorInFlight.current) return;
    const action: TutorAction = { id: crypto.randomUUID(), kind: "ask_question", question: chatDraft.trim() };
    const data: TutorRequest = { problem: snapshot.problem, history, action, transcript: transcript() };
    setRetryRequest(null); recordAction(action);
    if (await requestTutor(data)) setChatDraft(previous => previous.trim() === action.question ? "" : previous);
  }
  async function requestHint() {
    if (!tutorEnabled || full || mathInFlight.current || tutorInFlight.current || teachingState.hintLevel >= 3) return;
    const action: TutorAction = { id: crypto.randomUUID(), kind: "request_hint" };
    const data: TutorRequest = { problem: snapshot.problem, history, action, transcript: transcript() };
    setRetryRequest(null); recordAction(action);
    if (!(await requestTutor(data))) setHistory(previous => previous.filter(item => item.id !== action.id));
  }
  async function retryGuidance() {
    if (!retryRequest || mathInFlight.current || tutorInFlight.current) return;
    if (await requestTutor(retryRequest)) {
      const action = retryRequest.action;
      if (action.kind === "submit_step") setDraft(previous => previous === action.equation ? "" : previous);
      if (action.kind === "ask_question") setChatDraft(previous => previous.trim() === action.question ? "" : previous);
    }
  }
  function reset() {
    if (mathInFlight.current || tutorInFlight.current) return;
    update(previous => emptySession(previous.problem, previous.origin));
    setNetworkError(null); setTutorError(null); setRetryRequest(null); setConnection("unchecked");
  }
  return {
    problem, ready: learning.ready, acceptedSteps, draft, setDraft, feedback, pending: !learning.ready || checking || tutorPending, checking, networkError, submit, reset,
    messages, chatDraft, setChatDraft, tutorEnabled, availability, connection, tutorPending, tutorError, teachingState, full,
    canRetry: !!retryRequest, sendQuestion, requestHint, retryGuidance, refreshAvailability,
  };
}

type StudySession = ReturnType<typeof useSessionState>;
const SessionContext = createContext<StudySession | null>(null);
function SessionController({ scope, children }: { scope: SessionScope; children: ReactNode }) {
  const session = useSessionState(scope);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
export function StudySessionProvider({ children }: { children: ReactNode }) {
  return <LearningProvider><SessionController scope="study">{children}</SessionController></LearningProvider>;
}
export function PracticeSessionProvider({ children }: { children: ReactNode }) {
  const learning = useLearning();
  return <SessionController key={learning.data.practice?.runId ?? "empty"} scope="practice">{children}</SessionController>;
}
export function useStudySession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("StudySessionProvider is required");
  return session;
}
