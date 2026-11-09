import type { Metadata } from "next";
import { StudyWorkspace } from "@/components/study/study-workspace";

export const metadata: Metadata = { title: "Study", description: "Check each algebra step independently and ask the AI tutor for guidance when the service is enabled." };

export default function StudyPage() {
  return <StudyWorkspace />;
}
