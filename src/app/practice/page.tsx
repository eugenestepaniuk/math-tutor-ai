import type { Metadata } from "next";
import { Target } from "lucide-react";
import { PendingPage } from "@/components/ui/pending-page";

export const metadata: Metadata = { title: "Practice", description: "Related algebra practice is not available yet. Explore the MathTutor AI workspace preview." };

export default function PracticePage() {
  return (
    <PendingPage
      eyebrow="Practice"
      title="Give your understanding room to grow."
      description="A space for related problems and another chance to reason through each step."
      icon={Target}
      emptyTitle="Practice is being prepared."
    >
      Verified practice problems will appear here once interactive lessons are available.
    </PendingPage>
  );
}
