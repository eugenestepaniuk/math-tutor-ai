import type { Metadata } from "next";
import { CurriculumView } from "@/components/learning/curriculum-view";

export const metadata: Metadata = { title: "Curriculum", description: "Start the available linear-equations lesson and practise the distributive property step by step." };

export default function CurriculumPage() { return <CurriculumView />; }
