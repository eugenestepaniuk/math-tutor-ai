"use client";

import { ArrowUp, Lightbulb, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";
import { MathText } from "./math-text";
import { useStudySession } from "./study-session";

export function TutorChat() {
  const session = useStudySession();
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [session.messages, session.tutorPending]);

  async function send(event: FormEvent) {
    event.preventDefault();
    await session.sendQuestion();
  }

  const hintLabel = session.teachingState.hintLevel >= 3 ? "Hint limit reached"
    : session.teachingState.hintLevel === 2 ? "Show worked step" : "Hint";

  return (
    <section className="tutor-chat" aria-label="Tutor conversation">
      {!session.tutorEnabled && <div className="ai-unavailable-note">
        <p>AI tutoring is unavailable. You can still check every algebra step.</p>
        <button type="button" className="sample-button" onClick={() => void session.refreshAvailability()}>
          <RefreshCw size={14} aria-hidden="true" />Check availability
        </button>
      </div>}
      <div className="tutor-messages" ref={log} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation messages">
        {session.messages.length === 0 && <p className="chat-empty">Ask a question about your reasoning, or check a step to begin.</p>}
        {session.messages.map(message => <article key={message.id} className={`chat-message chat-message-${message.role}`}>
          <span className="chat-author">{message.role === "student" ? "You" : message.role === "tutor" ? "AI Tutor" : "Verified guidance"}</span>
          {message.role === "student" && message.equation ? <div className="math-scroll"><MathText equation={message.equation} /></div> : <p>{message.text}</p>}
          {message.guidingQuestion && <p className="guiding-question">{message.guidingQuestion}</p>}
          {message.role === "tutor" && message.equation && <div className="tutor-example"><p className="example-caption">Checked example</p><div className="math-scroll"><MathText equation={message.equation} /></div></div>}
        </article>)}
        {session.tutorPending && <p className="tutor-loading" role="status"><LoaderCircle className="spinner" size={16} aria-hidden="true" />The tutor is thinking…</p>}
      </div>
      {session.tutorError && <div className="tutor-error">
        <p role="alert">{session.tutorError}</p>
        {session.canRetry && <button type="button" className="sample-button" disabled={session.pending} onClick={() => void session.retryGuidance()}>Retry AI guidance</button>}
      </div>}
      {session.full && <p className="tutor-limit" role="status">This session has reached its interaction limit. Start again to continue.</p>}
      <form className="chat-composer" onSubmit={send} aria-busy={session.tutorPending}>
        <label htmlFor="tutor-question">Ask your tutor</label>
        <textarea id="tutor-question" rows={2} maxLength={800} value={session.chatDraft}
          onChange={event => session.setChatDraft(event.target.value)}
          placeholder={session.tutorEnabled ? "What would you like to understand?" : "AI tutoring is unavailable"}
          disabled={!session.tutorEnabled || session.pending || session.full}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); void session.sendQuestion();
            }
          }} />
        <div className="chat-actions">
          <button type="button" className="button button-secondary hint-button" onClick={() => void session.requestHint()}
            disabled={!session.tutorEnabled || session.pending || session.full || session.teachingState.hintLevel >= 3 || session.feedback?.isComplete}>
            <Lightbulb size={17} aria-hidden="true" />{hintLabel}
          </button>
          <button type="submit" className="button button-primary send-question" aria-label="Send question"
            disabled={!session.tutorEnabled || session.pending || session.full || !session.chatDraft.trim()}>
            <ArrowUp size={19} aria-hidden="true" /><span>Send</span>
          </button>
        </div>
      </form>
    </section>
  );
}
