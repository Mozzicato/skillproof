import Link from "next/link";
import { competency } from "@/lib/framework";
import { competencyScore, evidenceTrust, levelName, skillTrust, type ClaimVerdict, type GapStatus, type Trust } from "@/lib/scoring";
import type { Claim, CompetencyId, Evidence, EvidenceSource } from "@/lib/types";

export function PageHead({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="page-head">
      <h1>{title}</h1>
      <p className="muted">{intro}</p>
    </header>
  );
}

const STATUS_CLASS: Record<GapStatus | ClaimVerdict, string> = {
  Met: "good",
  Proven: "good",
  Close: "mid",
  "Partly proven": "mid",
  Gap: "bad",
  Unproven: "bad",
  "No evidence": "none",
};

export function Status({ value }: { value: GapStatus | ClaimVerdict }) {
  return <span className={`status ${STATUS_CLASS[value]}`}>{value}</span>;
}

const TRUST_CLASS: Record<Trust, string> = {
  Defended: "good",
  "AI-evaluated": "mid",
  Assessed: "mid",
  "Could not defend": "bad",
  "Claimed only": "bad",
  "No evidence": "none",
};

export function TrustLabel({ value }: { value: Trust }) {
  return <span className={`status ${TRUST_CLASS[value]}`} style={{ display: "block" }}>{value}</span>;
}

export function SkillLegend() {
  return (
    <div className="legend">
      <span><i className="key proven" />Proven by evidence</span>
      <span><i className="key claimed" />Claimed on CV</span>
      <span><i className="key req" />Role requires</span>
    </div>
  );
}

export function SkillBar({
  id,
  evidence,
  claims,
  required,
  href,
}: {
  id: CompetencyId;
  evidence: Evidence[];
  claims: Claim[];
  required?: number;
  href: string;
}) {
  const score = competencyScore(evidence, id);
  const claim = claims.find((c) => c.competencyId === id);
  const summary = `Proven ${score ?? "none"}${claim ? `, claimed ${claim.level}` : ""}${required ? `, requires ${required}` : ""}`;
  return (
    <Link className="skill" href={href} title={summary}>
      <span className="skill-name">{competency(id).name}</span>
      <span className="bars" aria-label={summary}>
        <span className="bar-track"><span className="bar proven" style={{ display: "block", width: `${score ?? 0}%` }} /></span>
        {claim && <span className="bar-track"><span className="bar claimed" style={{ display: "block", width: `${claim.level}%` }} /></span>}
        {required !== undefined && <span className="req-tick" style={{ left: `${required}%` }} />}
      </span>
      <span className="small">
        <span className="muted">{score ?? "–"}, {levelName(score)}</span>
        <TrustLabel value={skillTrust(evidence, claims, id)} />
      </span>
    </Link>
  );
}

const SOURCE_LABEL: Record<EvidenceSource, string> = {
  assessment: "Assessment",
  project: "Project",
  interview: "Mock interview",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function EvidenceItem({ item, showSkill = false }: { item: Evidence; showSkill?: boolean }) {
  return (
    <div className="stack" style={{ gap: "0.4rem" }}>
      <div className="row between">
        <h3>{showSkill ? `${competency(item.competencyId).name}: ${item.title}` : item.title}</h3>
        <span className="small muted">{SOURCE_LABEL[item.source]}, {formatDate(item.createdAt)}, scored {item.score}</span>
      </div>
      <TrustLabel value={evidenceTrust(item)} />
      {item.criterion && <p className="small muted">Criterion: {item.criterion}</p>}
      {item.excerpt && <div><code className="excerpt">{item.excerpt}</code></div>}
      <p>{item.rationale}</p>
    </div>
  );
}
