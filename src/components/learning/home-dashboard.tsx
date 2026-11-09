"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, History, Lightbulb, Target } from "lucide-react";
import { useLearning } from "./learning-provider";
import { categoryLabels } from "./learning-labels";
import { learningStats } from "@/lib/learning/events";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { DistributiveRule, MathText } from "@/components/study/math-text";
import { useStudySession } from "@/components/study/study-session";

function LearningIllustration() {
  return <div className="learning-illustration" aria-hidden="true">
    <svg className="hero-orbits" viewBox="0 0 340 280" fill="none">
      <circle cx="174" cy="135" r="110" /><ellipse cx="174" cy="135" rx="142" ry="57" transform="rotate(-35 174 135)" />
      <path d="M34 135h280M174 18v240M69 222l203-170" /><circle cx="69" cy="222" r="5" /><circle cx="271" cy="52" r="5" />
    </svg>
    <div className="hero-paper hero-paper-back" />
    <div className="hero-paper"><span className="hero-paper-label">Make the connection</span><span className="hero-brackets">( x + y )</span><div className="hero-paper-rule"><DistributiveRule /></div><span className="hero-paper-line" /><span className="hero-paper-line hero-paper-line-short" /></div>
    <span className="hero-symbol hero-symbol-plus">+</span><span className="hero-symbol hero-symbol-equals">=</span>
  </div>;
}

export function HomeDashboard() {
  const learning = useLearning();
  const study = useStudySession();
  const stats = learningStats(learning.data.events);
  const complete = !!study.feedback?.isComplete;
  const started = study.messages.length > 0 || !!study.draft.trim();
  const lastMistake = learning.data.events.findLast(event => event.kind === "mistake" && event.mistakeKind);
  const startRelated = !!learning.data.related && !learning.data.practice;
  const practiceLabel = learning.data.practice ? "Open practice" : startRelated ? "Try related practice" : "Explore practice";
  const metrics = [
    { label: "Completed exercises", value: stats.completed, icon: CheckCircle2 },
    { label: "Checked attempts", value: stats.attempts, icon: History },
    { label: "Corrected reasoning errors", value: stats.corrected, icon: Lightbulb },
  ];

  return <>
    <PageHeading eyebrow="Your learning space" title="Hi there! Ready to continue?">A quiet place to work through a problem, one step at a time.</PageHeading>
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-content"><span className="home-hero-label">Algebra · One step at a time</span><h2 id="home-hero-title">Learn Math<br />Step by Step</h2><p>Learn math step by step, with guidance that makes you think.</p>
        <Link href="/study" className="button home-hero-button">Continue learning<ArrowRight size={18} aria-hidden="true" /></Link>
      </div><LearningIllustration />
    </section>

    <div className="section-heading"><h2>Your activity</h2><span>Saved in this browser</span></div>
    {!learning.ready && <p className="history-empty" role="status">Loading your learning history…</p>}
    <div className="home-metrics" aria-busy={!learning.ready}>{metrics.map(({ label, value, icon: Icon }) =>
      <Card key={label} className="home-metric" aria-label={label}><div><strong>{learning.ready ? value : "—"}</strong><span className="icon-tile"><Icon size={21} aria-hidden="true" /></span></div><h3>{label}</h3></Card>)}
    </div>

    <div className="home-detail-grid">
      <Card className="home-lesson" aria-labelledby="current-lesson-title">
        <div className="card-heading"><span className="icon-tile"><BookOpen size={23} aria-hidden="true" /></span><div><p className="eyebrow">Current lesson</p><h2 id="current-lesson-title">Linear equations</h2></div>
          <span className={`status-tag ${complete ? "status-tag-success" : "status-tag-blue"}`}>{!learning.ready ? "Loading…" : complete ? "Completed" : started ? "In progress" : "Ready to start"}</span>
        </div>
        <p>Apply the distributive property, keep both sides balanced and isolate the variable.</p>
        <div className="home-current-equation"><span>{complete ? "Your checked final value" : study.acceptedSteps.length ? "Your last accepted step" : "Your starting equation"}</span><div className="math-scroll"><MathText equation={study.acceptedSteps.at(-1) ?? study.problem.equation} /></div></div>
        <div className="home-lesson-footer"><span>{learning.ready ? `${study.acceptedSteps.length} accepted ${study.acceptedSteps.length === 1 ? "step" : "steps"}` : "Loading saved work…"}</span><Link href="/study" className="text-link">{complete ? "Review your solution" : "Continue lesson"}<ArrowRight size={17} aria-hidden="true" /></Link></div>
      </Card>

      <Card className="home-practice" aria-labelledby="suggested-practice-title">
        <div className="card-heading"><span className="icon-tile"><Target size={23} aria-hidden="true" /></span><h2 id="suggested-practice-title">Suggested practice</h2></div>
        <p>{learning.data.related ? "Revisit the same idea in a different, independently checked equation." : "Give the distributive property another try with a new linear equation."}</p>
        <Link href="/practice" className="button button-secondary" aria-disabled={!learning.ready} onClick={event => { if (!learning.ready) event.preventDefault(); else if (startRelated) learning.startPractice(true); }}>{practiceLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
        <div className="home-reasoning" role="region" aria-label="Recent reasoning"><h3>Recent reasoning</h3><p>{!learning.ready ? "Loading saved activity…" : lastMistake?.mistakeKind ? `Last idea to revisit: ${categoryLabels[lastMistake.mistakeKind]}.` : stats.attempts ? "No mathematical mistakes recorded. Keep reasoning through each step." : "No learning history yet. Your checked steps will build a record here."}</p></div>
        <Link href="/progress" className="text-link">View progress<ArrowRight size={17} aria-hidden="true" /></Link>
      </Card>
    </div>
  </>;
}
