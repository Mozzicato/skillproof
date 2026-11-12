import { Check } from "lucide-react";
import { PlanButton } from "@/components/client";
import { PageHead, formatDate } from "@/components/ui";
import { getStudent } from "@/lib/store";

const PRO = [
  "A personalised growth plan and two-week sprints with milestones",
  "Workplace simulations: projects, project defences and mock interviews",
  "AI feedback on every submission, quoting your own work",
  "A quarterly reassessment allowance",
  "A shareable Skill Passport with verified badges and a PDF report",
];

export default async function UpgradePage() {
  const student = await getStudent();
  const pro = student.plan?.tier === "pro";
  return (
    <div className="stack-lg">
      <PageHead title={pro ? "You are on SkillProof Pro" : "Upgrade to SkillProof Pro"} intro="Turn skill assessment into measurable career development." />
      <section className="panel stack checkout">
        <div className="row between">
          <h2>SkillProof Pro</h2>
          <p className="plan-price"><b>$29.99</b> <span className="muted">per year</span></p>
        </div>
        <ul className="plan-features">
          {PRO.map((f) => <li key={f}><Check size={18} aria-hidden="true" /><span>{f}</span></li>)}
        </ul>
        <p className="notice">
          <span className="badge judge">Practice checkout</span> Payments are not switched on in this build. Upgrading here takes no card details and charges nothing; it only marks this account as Pro.
        </p>
        {pro ? (
          <div className="row">
            <span className="status good">Pro since {formatDate(student.plan!.since)}, practice upgrade, nothing charged</span>
            <PlanButton tier="free" label="Switch back to Free" quiet />
          </div>
        ) : (
          <div className="row"><PlanButton tier="pro" label="Upgrade with a practice checkout" /></div>
        )}
      </section>
    </div>
  );
}
