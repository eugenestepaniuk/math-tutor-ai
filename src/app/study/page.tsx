import type { Metadata } from "next";
import { FunctionSquare, MessagesSquare, NotebookPen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export const metadata: Metadata = { title: "Study", description: "Preview the problem and tutor workspace. Step checking and AI tutoring are not available yet." };

export default function StudyPage() {
  return (
    <>
      <PageHeading eyebrow="Study / Algebra" title="Your learning workspace">A place for your reasoning, with room for a little guidance.</PageHeading>
      <div className="study-grid">
        <Card className="study-panel" aria-labelledby="problem-title">
          <div className="panel-heading"><span className="status-tag status-tag-blue">Problem workspace</span><NotebookPen size={21} aria-hidden="true" /></div>
          <h2 id="problem-title">One step at a time.</h2>
          <div className="problem-inset"><FunctionSquare size={40} strokeWidth={1.4} aria-hidden="true" /><p>Your next lesson will appear here.</p></div>
          <div className="panel-empty-copy"><h3>A space for your solution</h3><p>Interactive lessons and step checking are not available yet.</p></div>
        </Card>
        <Card className="study-panel tutor-panel" aria-labelledby="tutor-title">
          <div className="tutor-heading"><span className="icon-tile"><MessagesSquare size={24} strokeWidth={1.6} aria-hidden="true" /></span><div><h2 id="tutor-title">AI Tutor</h2><span className="tutor-status">Not connected</span></div></div>
          <div className="tutor-empty"><MessagesSquare size={38} strokeWidth={1.3} aria-hidden="true" /><h3>Room for a conversation.</h3><p>AI tutoring is not available in this preview. No messages have been generated.</p></div>
          <p className="panel-note">Tutor guidance will appear here when the service is connected.</p>
        </Card>
      </div>
    </>
  );
}
