import type { Metadata } from "next";
import { PracticeView } from "@/components/learning/practice-view";
export const metadata: Metadata = { title: "Practice", description: "Practise verified linear equations with step-by-step checking and optional AI guidance." };
export default function PracticePage() { return <PracticeView />; }
