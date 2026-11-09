import { ArrowRight, BookOpen, History } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export default function HomePage() {
  return (
    <>
      <PageHeading eyebrow="Your learning space" title="Hi there. Make room for math.">A quiet place to work through a problem, one step at a time.</PageHeading>
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-content">
          <span className="welcome-label">MathTutor AI</span>
          <h2 id="welcome-title">Understand<br />every step.</h2>
          <p>Learn math step by step, with guidance that makes you think.</p>
          <Link href="/study" className="button button-primary">View study workspace<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <svg className="welcome-geometry" viewBox="0 0 280 260" fill="none" aria-hidden="true">
          <circle cx="140" cy="130" r="98" />
          <circle cx="140" cy="130" r="66" />
          <path d="M42 130h196M140 32v196M66 196l148-132M66 196h148V64L66 196Z" />
          <circle className="geometry-point" cx="66" cy="196" r="6" />
          <circle className="geometry-point" cx="214" cy="64" r="6" />
        </svg>
      </section>
      <div className="overview-grid">
        <Card aria-labelledby="lesson-title">
          <div className="card-heading"><span className="icon-tile"><BookOpen size={21} aria-hidden="true" /></span><h2 id="lesson-title">Your study workspace</h2></div>
          <p>Work through a linear equation and check each step. Open Study to view tutor availability.</p>
          <Link href="/study" className="text-link">Explore the layout<ArrowRight size={17} aria-hidden="true" /></Link>
        </Card>
        <Card aria-labelledby="history-title">
          <div className="card-heading"><span className="icon-tile"><History size={21} aria-hidden="true" /></span><h2 id="history-title">Learning history</h2></div>
          <p>No learning history yet. Completed exercises and practice activity will appear here once lessons are available.</p>
          <Link href="/progress" className="text-link">View progress page<ArrowRight size={17} aria-hidden="true" /></Link>
        </Card>
      </div>
    </>
  );
}
