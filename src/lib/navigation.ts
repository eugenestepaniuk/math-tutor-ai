import { BookOpen, ChartNoAxesColumnIncreasing, House, Play, Target } from "lucide-react";

export const navigation = [
  { href: "/", label: "Home", icon: House, section: "Overview" },
  { href: "/study", label: "Study", icon: Play, section: "Learning workspace" },
  { href: "/practice", label: "Practice", icon: Target, section: "Related practice" },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumnIncreasing, section: "Learning activity" },
  { href: "/curriculum", label: "Curriculum", icon: BookOpen, section: "Learning path" },
] as const;
