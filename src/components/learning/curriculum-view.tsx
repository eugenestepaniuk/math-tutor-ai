"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock3, Layers } from "lucide-react";
import { useLearning } from "./learning-provider";
import { useStudySession } from "@/components/study/study-session";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

const futureTopics = [
  { title: "Expressions and operations", description: "A dedicated introduction to simplifying expressions." },
  { title: "Systems of equations", description: "Reasoning about more than one equation." },
  { title: "Quadratic equations", description: "Exploring equations beyond the linear case." },
];

export function CurriculumView() {
  const learning = useLearning();
  const study = useStudySession();
  const completed = learning.data.events.some(event => event.kind === "problem_completed" && event.problemId === "starter");
  const started = study.messages.length > 0 || !!study.draft.trim();
  return <>
    <PageHeading eyebrow="Curriculum" title="Build understanding, step by step.">Start with linear equations and the distributive property.</PageHeading>
    <div className="curriculum-overview"><span className="icon-tile"><Layers size={24} aria-hidden="true" /></span><div><h2>Algebra</h2><p>1 available lesson</p></div><span className="status-tag status-tag-blue">Intro algebra</span></div>
    <div className="curriculum-grid">
      <Card className="curriculum-lesson" id="linear-equations" aria-labelledby="available-lesson-title">
        <ol className="lesson-path" aria-label="Lesson path"><li>Algebra</li><li><ChevronRight size={13} aria-hidden="true" />Linear equations</li><li><ChevronRight size={13} aria-hidden="true" />Distributive property</li></ol>
        <div className="curriculum-lesson-heading"><span className="lesson-number">01</span><span className={`status-tag ${completed ? "status-tag-success" : "status-tag-blue"}`}>{!learning.ready ? "Loading…" : completed ? "Completed" : started ? "In progress" : "Ready to start"}</span></div>
        <h2 id="available-lesson-title">Solving linear equations</h2><p>Work through an equation, check each transformation and test the same idea in related practice.</p>
        <ul className="lesson-skills">{["Expand brackets with the distributive property", "Use the same operation on both sides", "Isolate the variable and verify its value"].map(skill => <li key={skill}><Check size={17} aria-hidden="true" />{skill}</li>)}</ul>
        <Link href="/study" className="button button-primary">{completed ? "Revisit lesson" : "Open lesson"}<ArrowRight size={17} aria-hidden="true" /></Link>
      </Card>
      <Card className="curriculum-progress" aria-labelledby="lesson-completion-title"><span className="icon-tile"><BookOpen size={24} aria-hidden="true" /></span><h2 id="lesson-completion-title">Your lesson progress</h2>
        {!learning.ready ? <p role="status">Loading saved progress…</p> : <><p className="curriculum-completion-count"><strong>{completed ? 1 : 0}</strong> of 1 available lesson completed</p><progress max={1} value={completed ? 1 : 0} aria-label="Available lesson completion" />
          <p>{completed ? "Your final value was independently checked. Revisit the lesson whenever you want to review your reasoning." : "Complete the starter equation with a checked final value to record this lesson."}</p>
          {completed && <span className="completion-note"><CheckCircle2 size={17} aria-hidden="true" />Final value verified</span>}
        </>}
        <Link href="/progress" className="text-link">View learning history<ArrowRight size={17} aria-hidden="true" /></Link>
      </Card>
    </div>
    <div className="section-heading"><h2>More algebra topics</h2><span>Coming later</span></div>
    <ul className="future-topics" aria-label="Coming later topics">{futureTopics.map(topic => <li key={topic.title}><Clock3 size={20} aria-hidden="true" /><div><h3>{topic.title}</h3><p>{topic.description}</p><span className="status-tag">Coming later</span></div></li>)}</ul>
  </>;
}
