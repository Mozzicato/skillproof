"use client";

import {
  Briefcase,
  ClipboardCheck,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageCircle,
  Mic,
  ShieldCheck,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { CycleStep } from "@/lib/scoring";

const LINKS: Record<CycleStep["name"], { href: string; label: string; icon: LucideIcon }[]> = {
  Assess: [{ href: "/student/assessment", label: "Career assessment", icon: ClipboardCheck }],
  Identify: [{ href: "/student/gaps", label: "Skill gaps", icon: Target }],
  Develop: [
    { href: "/student/coach", label: "Career coach", icon: MessageCircle },
    { href: "/student/projects", label: "Recommended projects", icon: FolderKanban },
  ],
  Demonstrate: [
    { href: "/student/projects#submitted", label: "Project evaluations", icon: ShieldCheck },
    { href: "/student/interview", label: "Mock interview", icon: Mic },
  ],
  Reassess: [{ href: "/student/progress", label: "Progress", icon: TrendingUp }],
  Connect: [
    { href: "/student/opportunities", label: "Jobs and internships", icon: Briefcase },
    { href: "/student/resume", label: "CV", icon: FileText },
  ],
};

export function StudentNav({ steps }: { steps: CycleStep[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = (href: string) => (pathname === href ? ("page" as const) : undefined);

  return (
    <>
      <div className="rail-top">
        <Link href="/" className="brand">SkillProof</Link>
        <button type="button" className="btn quiet btn-sm menu-toggle" aria-expanded={open} aria-controls="student-nav" onClick={() => setOpen(!open)}>
          {open ? "Close menu" : "Menu"}
        </button>
      </div>
      <nav id="student-nav" className={`rail-nav${open ? " open" : ""}`} aria-label="Your development cycle" onClick={() => setOpen(false)}>
        <Link className="nav-link" href="/student" aria-current={current("/student")}>
          <LayoutDashboard size={18} aria-hidden="true" />Overview
        </Link>
        {steps.map((step, index) => (
          <div className="nav-group" key={step.name}>
            <div className="nav-group-title">
              <span className={`step-num${step.done ? " done" : ""}`} aria-hidden="true">{index + 1}</span>
              {step.name}
              {step.done && <span className="sr-only">, done</span>}
            </div>
            {LINKS[step.name].map(({ href, label, icon: Icon }) => (
              <Link className="nav-link" key={href} href={href} aria-current={current(href)}>
                <Icon size={18} aria-hidden="true" />{label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
