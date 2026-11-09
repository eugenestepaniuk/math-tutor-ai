import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";
import { StudySessionProvider } from "@/components/study/study-session";

export const metadata: Metadata = {
  title: { default: "MathTutor AI — Understand every step", template: "%s | MathTutor AI" },
  description: "Step-by-step algebra practice with independent mathematical checking and optional AI guidance.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><StudySessionProvider><AppShell>{children}</AppShell></StudySessionProvider></body>
    </html>
  );
}
