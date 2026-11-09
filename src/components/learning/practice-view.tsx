"use client";

import { useState } from "react";
import { ArrowRight, RefreshCw, Target } from "lucide-react";
import { useLearning } from "./learning-provider";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PracticeSessionProvider, useStudySession } from "@/components/study/study-session";
import { StudyWorkspace } from "@/components/study/study-workspace";

function ActivePractice() {
  const learning = useLearning();
  const session = useStudySession();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function another() {
    try { learning.startPractice(); setConfirm(false); }
    catch { setError("Another equation could not be prepared. Keep working here or clear saved history to start a new set."); }
  }
  return <>
    <div className="practice-toolbar">
      <p>{learning.data.practice?.origin ? "A concept check for the reasoning you revisited." : "Each new equation is independently checked before you see it."}</p>
      {confirm ? <div className="confirm-actions"><span>Leave this unfinished equation?</span><button className="button button-secondary" disabled={session.pending} onClick={another}>Generate another</button><button className="button button-secondary" onClick={() => setConfirm(false)}>Keep working</button></div>
        : <button className="button button-secondary" disabled={session.pending} onClick={() => session.feedback?.isComplete || (!session.draft && !session.messages.length) ? another() : setConfirm(true)}><RefreshCw size={17} aria-hidden="true" />Generate another</button>}
      {error && <p role="alert">{error}</p>}
    </div>
    <StudyWorkspace practice />
  </>;
}

export function PracticeView() {
  const learning = useLearning();
  if (learning.data.practice) return <PracticeSessionProvider><ActivePractice /></PracticeSessionProvider>;
  return <>
    <PageHeading eyebrow="Practice" title="Give your understanding room to grow.">Work through a new equation with the same step checker and optional AI tutor.</PageHeading>
    <Card className="practice-empty" aria-labelledby="practice-start-title"><span className="icon-tile"><Target size={25} aria-hidden="true" /></span>
      <h2 id="practice-start-title">{learning.data.related ? "Your related practice is ready." : "Ready for another equation?"}</h2>
      <p>{learning.data.related ? "Revisit the distributive property in a different problem." : "Generate a verified linear equation and work at your own pace."}</p>
      <button className="button button-primary" disabled={!learning.ready} onClick={() => learning.startPractice(!!learning.data.related)}>{learning.data.related ? "Start related practice" : "Start practice"}<ArrowRight size={17} aria-hidden="true" /></button>
    </Card>
  </>;
}
