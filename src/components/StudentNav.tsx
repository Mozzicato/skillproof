"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CycleStep } from "@/lib/scoring";

const LINKS: Record<CycleStep["name"], { href: string; label: string }[]> = {
  Assess: [{ href: "/student/assessment", label: "Career assessment" }],
  Identify: [{ href: "/student/gaps", label: "Skill gaps" }],
  Develop: [
    { href: "/student/coach", label: "Career coach" },
    { href: "/student/projects", label: "Recommended projects" },
  ],
  Demonstrate: [
    { href: "/student/projects#submitted", label: "Project evaluations" },
    { href: "/student/interview", label: "Mock interview" },
  ],
  Reassess: [{ href: "/student/progress", label: "Progress" }],
  Connect: [
    { href: "/student/opportunities", label: "Jobs and internships" },
    { href: "/student/resume", label: "CV" },
  ],
};

export function StudentNav({ steps }: { steps: CycleStep[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Your development cycle">
      <div className="step-links" style={{ margin: 0 }}>
        <Link href="/student" aria-current={pathname === "/student" ? "page" : undefined}>Overview</Link>
      </div>
      {steps.map((step, index) => (
        <div className="step" key={step.name}>
          <div className="step-name">
            <span className={`step-num${step.done ? " done" : ""}`}>{index + 1}</span>
            {step.name}
          </div>
          <div className="step-links">
            {LINKS[step.name].map((link) => (
              <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
