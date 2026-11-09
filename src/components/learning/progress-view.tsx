"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChartNoAxesColumnIncreasing, CheckCircle2, Lightbulb, Target, Trash2 } from "lucide-react";
import { useLearning } from "./learning-provider";
import { learningStats, type MistakeKind } from "@/lib/learning/events";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { useStudySession } from "@/components/study/study-session";

const categoryLabels: Record<MistakeKind, string> = { distribution: "Distributive property", combine_like_terms: "Combining like terms", sign_or_balance: "Signs and balance", arithmetic: "Arithmetic", unsupported_step: "Other non-equivalent steps" };
export function ProgressView() {
  const learning = useLearning();
  const study = useStudySession();
  const [confirm, setConfirm] = useState(false);
  const stats = learningStats(learning.data.events);
  const recent = learning.data.events.filter(event => ["mistake", "mistake_corrected", "problem_completed", "followup_completed", "hint_used"].includes(event.kind)).slice(-6).reverse();
  const cards = [
    { label: "Completed exercises", value: stats.completed, note: "Unique equations with a checked final value", icon: CheckCircle2 },
    { label: "Attempts", value: stats.attempts, note: "Submitted steps, including unreadable input", icon: ChartNoAxesColumnIncreasing },
    { label: "Corrected reasoning errors", value: stats.corrected, note: "Mistake categories followed by an accepted step", icon: Lightbulb },
    { label: "Follow-up accuracy", value: stats.followupAccuracy === null ? "—" : `${stats.followupAccuracy}%`, note: `${stats.passedFollowups} of ${stats.followups} attempted checks completed without repeating the target mistake`, icon: Target },
  ];
  return <>
    <PageHeading eyebrow="Progress" title="Every step is part of learning.">A record of what you have actually tried, checked and revisited in this browser.</PageHeading>
    {!learning.ready ? <p role="status">Loading saved history…</p> : <>
      <div className="progress-cards">{cards.map(({ label, value, note, icon: Icon }) => <Card key={label} className="progress-metric" aria-label={label}><span className="icon-tile"><Icon size={22} aria-hidden="true" /></span><h2>{label}</h2><strong>{value}</strong><p>{note}</p></Card>)}</div>
      {!stats.attempts && <Card className="progress-empty"><h2>No learning history yet.</h2><p>Check your first algebra step to begin. No practice score is estimated before you try.</p><Link className="button button-primary" href="/study">Start learning<ArrowRight size={17} aria-hidden="true" /></Link></Card>}
      <div className="progress-details">
        <Card aria-labelledby="accuracy-title"><h2 id="accuracy-title">Distributive property practice</h2>
          <p className="accuracy-value">{stats.practiceAccuracy === null ? "Not enough data" : `${stats.practiceAccuracy}% practice accuracy`}</p>
          <p>Accepted transformations divided by graded attempts. Unreadable input and unchanged equations are excluded. This is a practice measure, not a mastery assessment.</p>
          <dl className="progress-totals"><div><dt>Accepted steps</dt><dd>{stats.accepted}</dd></div><div><dt>Mathematical mistakes</dt><dd>{stats.mistakes}</dd></div><div><dt>Hints delivered</dt><dd>{stats.hints}</dd></div><div><dt>Follow-ups in progress</dt><dd>{stats.followups - stats.completedFollowups}</dd></div></dl>
        </Card>
        <Card aria-labelledby="mistakes-title"><h2 id="mistakes-title">Ideas to revisit</h2>{stats.mistakes ? <ul className="category-list">{Object.entries(stats.categories).filter(([, count]) => count > 0).map(([kind, count]) => <li key={kind}><span>{categoryLabels[kind as MistakeKind]}</span><strong>{count}</strong></li>)}</ul> : <p className="history-empty">No mathematical mistakes recorded. Syntax errors are kept out of these categories.</p>}</Card>
      </div>
      <Card className="recent-activity" aria-labelledby="recent-title"><h2 id="recent-title">Recent activity</h2>{recent.length ? <ul>{recent.map(event => <li key={event.id}><span>{event.kind === "problem_completed" ? "Equation completed" : event.kind === "followup_completed" ? event.correct ? "Concept check passed" : "Concept check completed with the target mistake revisited" : event.kind === "mistake_corrected" ? "Reasoning corrected" : event.kind === "hint_used" ? "Tutor hint delivered" : categoryLabels[event.mistakeKind ?? "unsupported_step"]}</span><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</time></li>)}</ul> : <p className="history-empty">Your checked learning events will appear here.</p>}</Card>
      <section className="history-controls" aria-label="Saved history controls"><p>Saved on this browser only. Clearing history removes your solutions, drafts, chat and learning events.</p>{confirm ? <div className="confirm-actions"><span>Clear all saved learning history?</span><button className="button button-secondary" disabled={study.pending} onClick={() => { learning.clearHistory(); setConfirm(false); }}>Clear everything</button><button className="button button-secondary" onClick={() => setConfirm(false)}>Keep my history</button></div> : <button className="button button-secondary" disabled={study.pending} onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden="true" />Clear saved history</button>}</section>
    </>}
  </>;
}
