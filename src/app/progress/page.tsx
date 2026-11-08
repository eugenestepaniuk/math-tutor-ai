import type { Metadata } from "next";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { PendingPage } from "@/components/ui/pending-page";

export const metadata: Metadata = { title: "Progress", description: "No learning history has been recorded. Progress tracking is not available in this preview." };

export default function ProgressPage() {
  return (
    <PendingPage
      eyebrow="Progress"
      title="Every step is part of learning."
      description="A space to reflect on the problems you work through and the ideas you revisit."
      icon={ChartNoAxesColumnIncreasing}
      emptyTitle="No learning history yet."
    >
      Progress tracking is not available in this preview. No attempts, completed exercises or skill scores have been recorded.
    </PendingPage>
  );
}
