import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card className="empty-page">
      <p className="eyebrow">Page not found</p>
      <h1>Let’s find your way back.</h1>
      <p>This page doesn’t exist. Your workspace is still here.</p>
      <Link href="/" className="button button-secondary">Back to Home</Link>
    </Card>
  );
}
