import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PendingPage } from "@/components/ui/pending-page";

export const metadata: Metadata = { title: "Curriculum", description: "The MathTutor AI curriculum is being prepared. No lessons are available in this preview." };

export default function CurriculumPage() {
  return (
    <PendingPage
      eyebrow="Curriculum"
      title="Build understanding, step by step."
      description="A space for a clear path through algebra, starting with linear equations."
      icon={BookOpen}
      emptyTitle="Your learning path is being prepared."
    >
      The curriculum is not available yet. No lessons are marked as started or completed.
    </PendingPage>
  );
}
