import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { DEMO_STUDENT_ID } from "@/lib/seed";

export const metadata: Metadata = { title: "Plans and pricing | SkillProof AI" };

type Feature = { text: string; href?: string };

const PLANS: { name: string; price: string; period: string; audience: string; purpose: string; featured?: boolean; cta: { label: string; href: string }; features: Feature[] }[] = [
  {
    name: "SkillProof Free",
    price: "$0",
    period: "free for good",
    audience: "For students, graduates and independent coaches",
    purpose: "Build a trusted, evidence-based skills profile.",
    cta: { label: "Create your free account", href: "/signup" },
    features: [
      { text: "Core skill and career-readiness assessments", href: "/student/assessment" },
      { text: "Evidence-based competency profile", href: "/student/skills" },
      { text: "Personal dashboard and progress tracking", href: "/student/progress" },
      { text: "Basic skill-gap summary", href: "/student/gaps" },
      { text: "Limited peer and mentor feedback", href: "/student/passport" },
      { text: "Basic shareable skills profile", href: `/p/${DEMO_STUDENT_ID}` },
      { text: "Coach tools to invite and monitor a small number of learners", href: "/coach" },
      { text: "Access to assessment results and history", href: "/student/progress" },
    ],
  },
  {
    name: "SkillProof Pro",
    price: "$29.99",
    period: "per year",
    audience: "For students, graduates and early-career professionals",
    purpose: "Turn skill assessment into measurable career development.",
    featured: true,
    cta: { label: "Upgrade to Pro", href: "/student/upgrade" },
    features: [
      { text: "Everything in Free" },
      { text: "AI-generated personalised growth plan", href: "/student/plan" },
      { text: "Adaptive training roadmap with milestones", href: "/student/plan" },
      { text: "Detailed skill-gap analysis and targeted recommendations", href: "/student/gaps" },
      { text: "Workplace simulations and practical challenges", href: "/student/projects" },
      { text: "AI feedback on submitted work and evidence", href: "/student/projects#submitted" },
      { text: "Quarterly reassessment allowance", href: "/student/assessment" },
      { text: "Shareable Career Readiness Passport", href: "/student/passport" },
      { text: "Verified badges earned through qualifying assessments", href: "/student/skills" },
      { text: "Downloadable competency reports and portfolio", href: `/p/${DEMO_STUDENT_ID}` },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader section="Plans" />
      <main className="wide-page"><div className="wide stack-lg" style={{ maxWidth: 1000 }}>
        <header className="page-head">
          <h1>Start free. Upgrade when you are building toward a job.</h1>
          <p className="muted">Every score on both plans comes from evidence, never from claims. Select a feature to see it working in the judge demo.</p>
        </header>

        <div className="plans">
          {PLANS.map((plan) => (
            <section key={plan.name} className={`plan${plan.featured ? " featured" : ""}`} aria-labelledby={`${plan.name}-title`}>
              {plan.featured && <span className="badge good plan-flag">Most popular</span>}
              <h2 id={`${plan.name}-title`}>{plan.name}</h2>
              <p className="plan-price"><b>{plan.price}</b> <span className="muted">{plan.period}</span></p>
              <p className="small muted">{plan.audience}</p>
              <p>{plan.purpose}</p>
              <Link className={`btn${plan.featured ? "" : " quiet"}`} href={plan.cta.href}>{plan.cta.label}</Link>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f.text}>
                    <Check size={18} aria-hidden="true" />
                    <span>
                      {f.href ? <Link href={f.href}>{f.text}</Link> : f.text}
                      {!f.href && f.text !== "Everything in Free" && <span className="badge plan-soon">Planned</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="small muted">Pro is billed once a year. Payments are not switched on in this hackathon build: upgrading uses a practice checkout that takes no card details and charges nothing, and every Pro feature is open to try.</p>
      </div></main>
    </>
  );
}
