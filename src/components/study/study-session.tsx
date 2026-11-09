"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckStepResponse, type StepFeedback } from "@/lib/math/contracts";
import { MAX_TUTOR_ACTIONS, TutorAvailability, TutorResponse, type ChatMessage, type TeachingState, type TutorAction, type TutorRequest } from "@/lib/tutor/contracts";

async function readAvailability(signal?: AbortSignal) {
  try {
    const response = await fetch("/api/tutor", { signal, cache: "no-store" });
    if (!response.ok) throw new Error("unavailable");
    return TutorAvailability.parse(await response.json());
  } catch { return { enabled: false, configured: false }; }
}

function useSessionState() {
  const [acceptedSteps, setAcceptedSteps] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<StepFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [history, setHistory] = useState<TutorAction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [availability, setAvailability] = useState<{ enabled: boolean; configured: boolean } | null>(null);
  const [connection, setConnection] = useState<"unchecked" | "online" | "error">("unchecked");
  const [tutorPending, setTutorPending] = useState(false);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<TutorRequest | null>(null);
  const [teachingState, setTeachingState] = useState<TeachingState>({ phase: "awaiting_step", hintLevel: 0, acceptedSteps: 0 });
  const mathInFlight = useRef(false);
  const tutorInFlight = useRef(false);

  async function refreshAvailability() {
    setAvailability(await readAvailability());
  }

  useEffect(() => {
    const controller = new AbortController();
    void readAvailability(controller.signal).then(value => {
      if (!controller.signal.aborted) setAvailability(value);
    });
    return () => controller.abort();
  }, []);

  const tutorEnabled = !!availability?.enabled && !!availability.configured;
  const full = history.length >= MAX_TUTOR_ACTIONS;

  function transcript() {
    return messages.filter(message => message.role !== "checker").slice(-8).map(message => ({
      role: message.role as "student" | "tutor",
      text: (message.text + (message.guidingQuestion ? " " + message.guidingQuestion : "")).slice(0, 900),
    }));
  }

  function recordAction(action: TutorAction) {
    setHistory(previous => previous.some(item => item.id === action.id) ? previous : [...previous, action]);
    const message: ChatMessage = action.kind === "submit_step"
      ? { id: action.id, role: "student", text: action.equation, equation: action.equation }
      : { id: action.id, role: "student", text: action.kind === "ask_question" ? action.question : "Hint requested" };
    setMessages(previous => previous.some(item => item.id === message.id) ? previous : [...previous, message].slice(-128));
  }

  async function requestTutor(data: TutorRequest): Promise<boolean> {
    if (tutorInFlight.current) return false;
    tutorInFlight.current = true;
    setTutorPending(true);
    setTutorError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), signal: controller.signal,
      });
      if (!response.ok) throw new Error("tutor_failed");
      const payload = TutorResponse.parse(await response.json());
      if (payload.tutor.status !== "ready") {
        if (data.action.kind === "submit_step") setTeachingState(payload.state);
        setConnection("error");
        setTutorError(payload.tutor.message);
        setRetryRequest(payload.tutor.retryable ? data : null);
        if (payload.tutor.source === "checker") {
          setMessages(previous => [...previous.filter(item => item.id !== data.action.id + "-reply"), {
            id: data.action.id + "-reply", role: "checker", text: payload.tutor.message ?? "Review the verified checker feedback.",
          }]);
        }
        return false;
      }
      setTeachingState(payload.state);
      recordAction(data.action);
      setConnection("online");
      setRetryRequest(null);
      setMessages(previous => [...previous.filter(item => item.id !== data.action.id + "-reply"), {
        id: data.action.id + "-reply", role: "tutor", text: payload.tutor.message ?? "",
        guidingQuestion: payload.tutor.guidingQuestion,
        ...(payload.tutor.mathExample ? { equation: payload.tutor.mathExample } : {}),
      }]);
      return true;
    } catch {
      setConnection("error");
      setTutorError("The AI tutor couldn’t respond. Your message is still here; please try again.");
      setRetryRequest(data);
      return false;
    } finally {
      clearTimeout(timer);
      tutorInFlight.current = false;
      setTutorPending(false);
    }
  }

  async function submit() {
    if (mathInFlight.current || tutorInFlight.current || feedback?.isComplete || full) return;
    mathInFlight.current = true;
    setChecking(true);
    setNetworkError(null);
    setTutorError(null);
    setRetryRequest(null);
    const action: TutorAction = { id: crypto.randomUUID(), kind: "submit_step", equation: draft };
    const data: TutorRequest = { history, action, transcript: transcript() };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("/api/check-step", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptedSteps, equation: draft }), signal: controller.signal,
      });
      if (!response.ok) throw new Error("check_failed");
      const result = CheckStepResponse.parse(await response.json()).result;
      setFeedback(result);
      recordAction(action);
      if (result.canAdvance) setAcceptedSteps(previous => [...previous, result.submittedEquation]);
      let guidanceReady = true;
      if (tutorEnabled && result.parseStatus === "valid" && result.verdict !== "unchanged") {
        setChecking(false);
        guidanceReady = await requestTutor(data);
      }
      if (result.canAdvance && guidanceReady) setDraft("");
      return result;
    } catch {
      setNetworkError("The checker is unavailable. Your equation is saved in this session; please try again.");
    } finally {
      clearTimeout(timer);
      mathInFlight.current = false;
      setChecking(false);
    }
  }

  async function sendQuestion() {
    if (!chatDraft.trim() || !tutorEnabled || full || mathInFlight.current || tutorInFlight.current) return;
    const action: TutorAction = { id: crypto.randomUUID(), kind: "ask_question", question: chatDraft.trim() };
    const data: TutorRequest = { history, action, transcript: transcript() };
    setRetryRequest(null);
    recordAction(action);
    if (await requestTutor(data)) setChatDraft(previous => previous.trim() === action.question ? "" : previous);
  }

  async function requestHint() {
    if (!tutorEnabled || full || mathInFlight.current || tutorInFlight.current || teachingState.hintLevel >= 3) return;
    const action: TutorAction = { id: crypto.randomUUID(), kind: "request_hint" };
    const data: TutorRequest = { history, action, transcript: transcript() };
    setRetryRequest(null);
    recordAction(action);
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
    setAcceptedSteps([]); setDraft(""); setFeedback(null); setNetworkError(null);
    setHistory([]); setMessages([]); setChatDraft(""); setTutorError(null); setRetryRequest(null);
    setTeachingState({ phase: "awaiting_step", hintLevel: 0, acceptedSteps: 0 });
  }

  return {
    acceptedSteps, draft, setDraft, feedback, pending: checking || tutorPending, checking, networkError, submit, reset,
    messages, chatDraft, setChatDraft, tutorEnabled, availability, connection, tutorPending, tutorError,
    teachingState, full, canRetry: !!retryRequest, sendQuestion, requestHint, retryGuidance, refreshAvailability,
  };
}

type StudySession = ReturnType<typeof useSessionState>;
const SessionContext = createContext<StudySession | null>(null);

export function StudySessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionState();
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useStudySession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("StudySessionProvider is required");
  return session;
}
