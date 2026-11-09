"use client";

import { ArrowRight, BookOpen, Bot, Check, CheckCircle2, ChevronRight, CircleAlert, CornerDownLeft, Delete, Divide, Lightbulb, LoaderCircle, Minus, Plus, RotateCcw, Send, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { MAX_ACCEPTED_STEPS } from "@/lib/math/contracts";
import { MAX_EQUATION_LENGTH } from "@/lib/math/parser";
import { STARTER_EQUATION } from "@/lib/math/verifier";
import { DistributiveRule, MathText } from "./math-text";
import { useStudySession } from "./study-session";
import { TutorChat } from "./tutor-chat";

const stageLabels = { expand: "Expand the brackets", combine: "Bring the variable terms together", isolate: "Isolate the variable", check: "Check the value" };
const stagePrompts = { expand: "Apply the outside factor to every term inside the brackets.", combine: "Choose an operation that simplifies the variable terms on both sides.", isolate: "Use the same operation on both sides to leave the variable on its own.", check: "Substitute your value into the original equation to see that both sides agree." };

export function StudyWorkspace() {
  const session = useStudySession();
  const { acceptedSteps, draft, setDraft, feedback, pending, networkError } = session;
  const [ruleOpen, setRuleOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const completion = useRef<HTMLDivElement>(null);
  const complete = feedback?.isComplete ?? false;
  const limitReached = acceptedSteps.length >= MAX_ACCEPTED_STEPS || session.full;
  const current = acceptedSteps.at(-1) ?? STARTER_EQUATION;
  const stage = feedback?.canAdvance ? feedback.stage : acceptedSteps.length ? (feedback?.stage ?? "combine") : "expand";
  const invalid = !!feedback && feedback.submittedEquation === draft && (feedback.verdict === "incorrect" || feedback.parseStatus !== "valid");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (limitReached) return;
    const result = await session.submit();
    requestAnimationFrame(() => {
      if (result?.isComplete) completion.current?.focus();
      else input.current?.focus();
    });
  }

  function insert(value: string | null) {
    const start = input.current?.selectionStart ?? draft.length;
    const end = input.current?.selectionEnd ?? start;
    const from = value === null && start === end ? Math.max(0, start - 1) : start;
    const next = draft.slice(0, from) + (value ?? "") + draft.slice(end);
    if (next.length > MAX_EQUATION_LENGTH) return;
    setDraft(next);
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(from + (value?.length ?? 0), from + (value?.length ?? 0)); });
  }

  function restart() {
    session.reset(); setRuleOpen(false); setResetOpen(false);
    requestAnimationFrame(() => input.current?.focus());
  }

  const controls = [
    { value: "+", label: "Insert plus", icon: Plus }, { value: "-", label: "Insert minus", icon: Minus },
    { value: "*", label: "Insert multiplication", icon: X }, { value: "/", label: "Insert division", icon: Divide },
    { value: "(", label: "Insert opening bracket" }, { value: ")", label: "Insert closing bracket" },
    { value: "=", label: "Insert equals" }, { value: null, label: "Delete previous character", icon: Delete },
  ];

  return (
    <>
      <header className="lesson-heading">
        <div><p className="eyebrow">Linear equations</p><h1>Understand every step.</h1><p className="page-description">Try a step. Check your reasoning. Keep going.</p></div>
        <span className="lesson-tag"><BookOpen size={16} aria-hidden="true" /> Distributive property</span>
      </header>
      <div className="study-grid lesson-grid">
        <div className="problem-column">
          <Card className="solve-card" aria-labelledby="problem-title">
            <div className="task-heading"><span className="status-tag status-tag-blue">Your task</span><span className="lesson-level">Intro algebra</span></div>
            <h2 id="problem-title">Solve the equation</h2>
            <div className="equation-display" tabIndex={0} aria-label="Original problem"><MathText equation={STARTER_EQUATION} /></div>
            {acceptedSteps.length > 0 && !complete && <div className="current-line"><span>Continue from your last step</span><div className="math-scroll"><MathText equation={current} /></div></div>}

            {complete ? (
              <div className="completion-panel" tabIndex={-1} ref={completion} aria-labelledby="completion-title">
                <CheckCircle2 size={30} aria-hidden="true" /><h3 id="completion-title">Nice work. Equation solved!</h3>
                <div className="math-scroll"><MathText equation={current} /></div><p>Your value is mathematically verified. Review your reasoning below, or try this equation again.</p>
                <button className="button button-secondary" onClick={restart}><RotateCcw size={17} aria-hidden="true" />Try again</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} aria-busy={pending}>
                <div className="solution-label"><label htmlFor="solution-step">Your next step</label><button type="button" className="sample-button" disabled={pending} onClick={() => { setDraft("3x + 4 = 2x + 19"); input.current?.focus(); }}>Try sample mistake<ArrowRight size={14} aria-hidden="true" /></button></div>
                <input ref={input} id="solution-step" className="equation-input" type="text" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Type your next equation" maxLength={MAX_EQUATION_LENGTH} autoComplete="off" autoCapitalize="off" spellCheck={false} disabled={pending || limitReached} aria-invalid={invalid} aria-describedby={`equation-help${invalid ? " equation-error" : ""}`} />
                <p id="equation-help" className="equation-help">Use x, integers, +, −, *, / and brackets. Include both sides of the equation.</p>
                {invalid && <p id="equation-error" className="inline-math-error"><CircleAlert size={16} aria-hidden="true" />{feedback?.title}. Your last accepted step is unchanged.</p>}
                <div className="math-keypad" aria-label="Equation symbols">{controls.map(({ value, label, icon: Icon }) => <button key={label} type="button" aria-label={label} disabled={pending || limitReached} onClick={() => insert(value)}>{Icon ? <Icon size={18} aria-hidden="true" /> : value}</button>)}</div>
                {networkError && <p className="network-error" role="alert">{networkError}</p>}
                {limitReached && <p className="network-error" role="status">This session has reached its interaction limit. Start again to continue.</p>}
                <button type="submit" className="button button-primary check-step-button" disabled={pending || limitReached}>{pending ? <LoaderCircle size={19} className="spinner" aria-hidden="true" /> : <Send size={19} aria-hidden="true" />}{pending ? session.tutorPending ? "Getting guidance…" : "Checking your step…" : "Check My Step"}<span className="enter-hint" aria-hidden="true"><CornerDownLeft size={15} aria-hidden="true" />Enter</span></button>
              </form>
            )}
            {!complete && acceptedSteps.length > 0 && <div className="reset-area">{resetOpen ? <><span>Clear this solution?</span><button type="button" className="sample-button" disabled={pending} onClick={restart}>Start again</button><button type="button" className="sample-button" onClick={() => setResetOpen(false)}>Keep working</button></> : <button type="button" className="sample-button" disabled={pending} onClick={() => setResetOpen(true)}><RotateCcw size={14} aria-hidden="true" />Start again</button>}</div>}
          </Card>
          <section className="key-idea" aria-labelledby="key-idea-title"><span className="icon-tile"><BookOpen size={25} aria-hidden="true" /></span><div><p>Key idea</p><h2 id="key-idea-title">Distributive property</h2><DistributiveRule /></div></section>
        </div>

        <Card className="lesson-tutor" aria-labelledby="tutor-title">
          <div className="tutor-heading"><span className="tutor-avatar"><Bot size={31} strokeWidth={1.6} aria-hidden="true" /></span><div><h2 id="tutor-title">AI Tutor</h2><span className="tutor-status" data-connected={session.tutorEnabled && session.connection === "online"}>{session.tutorPending ? "Thinking…" : !session.availability ? "Checking availability…" : !session.tutorEnabled || session.connection === "error" ? "AI unavailable" : session.connection === "online" ? "Connected" : "Not connected yet"}</span></div></div>
          <TutorChat />
          <div className="checker-feedback" data-verdict={feedback?.verdict ?? "ready"} aria-live="polite" aria-atomic="true">
            <div className="feedback-label">Math checker</div>
            {feedback ? <><h3>{feedback.canAdvance ? <CheckCircle2 size={19} aria-hidden="true" /> : <CircleAlert size={19} aria-hidden="true" />}{feedback.isComplete ? "Solution verified" : feedback.title}</h3><p>{feedback.message}</p></> : <><h3>Start with the brackets.</h3><p>Enter an equation on the left to check whether your transformation keeps the same solution.</p></>}
          </div>
          <button type="button" className="rule-button" aria-expanded={ruleOpen} aria-controls="rule-reminder" onClick={() => setRuleOpen(!ruleOpen)}><Lightbulb size={19} aria-hidden="true" />{ruleOpen ? "Hide rule reminder" : "Review the rule"}<ChevronRight size={16} className={ruleOpen ? "turned" : ""} aria-hidden="true" /></button>
          {ruleOpen && <div id="rule-reminder" className="rule-reminder"><h3>Multiply every term.</h3><p>The factor outside the brackets multiplies each term inside. Keep the other side balanced as you work.</p><DistributiveRule /><span>Rule reminder · not an AI-generated hint</span></div>}
          <section className="reasoning-history" aria-labelledby="history-title"><div className="history-heading"><h3 id="history-title">Your reasoning</h3><span>{acceptedSteps.length} accepted {acceptedSteps.length === 1 ? "step" : "steps"}</span></div>
            {acceptedSteps.length === 0 ? <p className="history-empty">Your checked steps will appear here.</p> : <ol>{acceptedSteps.map((equation, index) => <li key={`${index}-${equation}`}><span className="accepted-mark"><Check size={14} aria-label="Accepted" /></span><div className="math-scroll"><MathText equation={equation} /></div></li>)}</ol>}
          </section>
          {!complete && <div className="next-goal"><span>Next goal</span><h3>{stageLabels[stage]}</h3><p>{stagePrompts[stage]}</p></div>}
          <p className="session-note">Your work and chat stay here while you navigate. Refreshing starts a new session. Progress tracking is not connected yet.</p>
        </Card>
      </div>
    </>
  );
}
