"use client";

import { ChevronRight, CircleUserRound, NotebookPen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui/brand";
import { navigation } from "@/lib/navigation";
import { StorageNotice } from "@/components/learning/learning-provider";

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? "mobile-nav" : "sidebar-nav"} aria-label={mobile ? "Mobile navigation" : "Main navigation"}>
      {navigation.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="nav-link" aria-current={pathname === href ? "page" : undefined}>
          <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const page = navigation.find(({ href }) => href === pathname);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="sidebar" aria-label="Sidebar">
        <Link className="brand-link" href="/" aria-label="MathTutor AI home"><Brand /></Link>
        <Navigation />
        <div className="sidebar-note">
          <NotebookPen size={24} aria-hidden="true" />
          <p>Room to reason.</p>
          <span>One step at a time.</span>
        </div>
      </aside>

      <div className="app-body">
        <header className="topbar">
          <Link className="mobile-brand brand-link" href="/" aria-label="MathTutor AI home"><Brand /></Link>
          <div className="page-context">
            <span>{pathname === "/study" ? "Algebra" : "Workspace"}</span>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="context-current">{pathname === "/study" ? "Linear Equations" : page?.label ?? "Page not found"}</span>
          </div>
          <div className="guest-label"><CircleUserRound size={20} aria-hidden="true" /><span>Guest</span></div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <StorageNotice />
          {children}
        </main>
        <footer className="workspace-footer"><span>MathTutor AI</span><span>Workspace preview</span></footer>
      </div>
      <Navigation mobile />
    </div>
  );
}
