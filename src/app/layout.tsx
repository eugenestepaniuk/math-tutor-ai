import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: { default: "MathTutor AI — Understand every step", template: "%s | MathTutor AI" },
  description: "A preview of the MathTutor AI learning workspace. Interactive lessons and AI tutoring are not available yet.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
