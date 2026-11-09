import type { Metadata } from "next";
import { ProgressView } from "@/components/learning/progress-view";
export const metadata: Metadata = { title: "Progress", description: "Review your actual algebra attempts, completed equations and related practice in this browser." };
export default function ProgressPage() { return <ProgressView />; }
