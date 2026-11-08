"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { CheckStepResponse, type StepFeedback } from "@/lib/math/contracts";

function useSessionState() {
  const [acceptedSteps, setAcceptedSteps] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<StepFeedback | null>(null);
  const [pending, setPending] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  async function submit() {
    if (requestInFlight.current || feedback?.isComplete) return;
    requestInFlight.current = true;
    setPending(true);
    setNetworkError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("/api/check-step", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptedSteps, equation: draft }), signal: controller.signal,
      });
      if (!response.ok) throw new Error("check_failed");
      const parsed = CheckStepResponse.safeParse(await response.json());
      if (!parsed.success) throw new Error("invalid_response");
      setFeedback(parsed.data.result);
      if (parsed.data.result.canAdvance) {
        setAcceptedSteps(previous => [...previous, parsed.data.result.submittedEquation]);
        setDraft("");
      }
      return parsed.data.result;
    } catch {
      setNetworkError("The checker is unavailable. Your equation is saved in this session; please try again.");
    } finally {
      clearTimeout(timer);
      requestInFlight.current = false;
      setPending(false);
    }
  }

  function reset() {
    if (requestInFlight.current) return;
    setAcceptedSteps([]); setDraft(""); setFeedback(null); setNetworkError(null);
  }

  return { acceptedSteps, draft, setDraft, feedback, pending, networkError, submit, reset };
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
