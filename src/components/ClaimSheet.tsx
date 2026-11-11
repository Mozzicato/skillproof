"use client";

import { useState } from "react";

export interface MarkedClaim {
  id: string;
  skill: string;
  text: string;
  mark: string;
  verdict: "Proven" | "Partly proven" | "Unproven";
  excerpt?: string;
  rationale: string;
}

const BADGE = { Proven: "good", "Partly proven": "mid", Unproven: "bad" } as const;

/** A sample CV checked against evidence: selecting a claim shows the proof behind its score. */
export function ClaimSheet({ name, claims }: { name: string; claims: MarkedClaim[] }) {
  const [activeId, setActiveId] = useState(claims[0]?.id);
  const active = claims.find((c) => c.id === activeId) ?? claims[0];
  if (!active) return null;

  return (
    <section className="sheet" aria-label="A sample CV checked against evidence">
      <div className="sheet-head">
        <h2>{name}&apos;s CV, checked</h2>
        <span className="badge">Sample student</span>
      </div>
      {claims.map((claim, index) => (
        <button key={claim.id} type="button" className="claim-row" aria-pressed={claim.id === active.id} onClick={() => setActiveId(claim.id)}>
          <span>{claim.text}</span>
          <span className={`badge ${BADGE[claim.verdict]}`} style={{ animationDelay: `${0.3 + index * 0.15}s` }}>{claim.mark}</span>
        </button>
      ))}
      <div className="sheet-proof" key={active.id} aria-live="polite">
        <strong>{active.skill}: {active.verdict.toLowerCase()}</strong>
        {active.excerpt && <div><code className="excerpt sweep">{active.excerpt}</code></div>}
        <p className="small muted">{active.rationale}</p>
      </div>
    </section>
  );
}
