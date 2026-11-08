import type { Metadata } from "next";
import { StudyWorkspace } from "@/components/study/study-workspace";

export const metadata: Metadata = { title: "Study", description: "Work through a linear equation and check each step with an independent algebra verifier. AI tutoring is not connected yet." };

export default function StudyPage() {
  return <StudyWorkspace />;
}
