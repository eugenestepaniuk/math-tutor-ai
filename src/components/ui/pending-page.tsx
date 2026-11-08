import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";

export function PendingPage({ eyebrow, title, description, icon: Icon, emptyTitle, children }: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  children: string;
}) {
  return (
    <>
      <PageHeading eyebrow={eyebrow} title={title}>{description}</PageHeading>
      <Card className="empty-page" aria-labelledby="empty-title">
        <div className="icon-tile"><Icon size={28} strokeWidth={1.6} aria-hidden="true" /></div>
        <span className="status-tag">Not available yet</span>
        <h2 id="empty-title">{emptyTitle}</h2>
        <p>{children}</p>
        <Link href="/study" className="button button-secondary">View study workspace<ArrowRight size={18} aria-hidden="true" /></Link>
      </Card>
    </>
  );
}
