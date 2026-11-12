import { notFound } from "next/navigation";
import { PrintButton } from "@/components/client";
import { EndorsementItem, QrCode, siteOrigin } from "@/components/passport";
import { SiteHeader } from "@/components/SiteHeader";
import { EvidenceItem, TrustLabel, formatDate } from "@/components/ui";
import { calibrationLabel, latestRun } from "@/lib/calibration";
import { COMPETENCIES, role } from "@/lib/framework";
import {
  STALE_AFTER_DAYS,
  competencyScore,
  daysSince,
  gapRows,
  growth,
  lastProven,
  levelName,
  newestFirst,
  readiness,
  skillTrust,
} from "@/lib/scoring";
import { findStudent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await findStudent(id);
  if (!student) notFound();

  const target = role(student.targetRoleId);
  const url = `${await siteOrigin()}/p/${student.id}`;
  const rows = gapRows(target.requirements, student.evidence, student.claims);
  const met = rows.filter((r) => r.status === "Met").length;
  const run = latestRun(student.assessments);
  const endorsements = student.endorsements ?? [];
  const defended = new Set(student.evidence.filter((e) => e.defence === "defended").map((e) => e.competencyId)).size;

  const proven = COMPETENCIES.flatMap((c) => {
    const score = competencyScore(student.evidence, c.id);
    return score === null ? [] : [{ skill: c, score }];
  }).sort((a, b) => b.score - a.score);

  return (
    <>
      <SiteHeader section="Skill Passport" />
      <main className="wide-page"><div className="wide stack-lg" style={{ maxWidth: 960 }}>
        <header className="passport-head">
          <div className="stack" style={{ gap: "0.5rem" }}>
            <h1>{student.name}</h1>
            <p className="muted">{student.department}, {student.university}. Aiming for {target.title}.</p>
            <dl className="passport-facts">
              <div><dt>Readiness</dt><dd>{readiness(target.requirements, student.evidence)}<span> of 100, {met} of {rows.length} requirements met</span></dd></div>
              {run && <div><dt>Self-awareness</dt><dd>{run.calibration}<span> of 100, {calibrationLabel(run).toLowerCase()}</span></dd></div>}
              <div><dt>Defended in person</dt><dd>{defended}<span> {defended === 1 ? "skill" : "skills"}</span></dd></div>
              <div><dt>Confirmed by people</dt><dd>{endorsements.length}<span> {endorsements.length === 1 ? "confirmation" : "confirmations"}</span></dd></div>
            </dl>
          </div>
          <div className="passport-qr">
            <QrCode url={url} label={`QR code linking to ${student.name}'s Skill Passport`} />
            <span className="small muted">Scan to verify</span>
            <PrintButton />
          </div>
        </header>

        <p className="small muted">
          Every score is calculated from evidence, never from what the student claims. Quoted passages are taken word for word from the student&apos;s own work.
          Self-awareness measures how well the student&apos;s confidence matched their results in the assessment.
        </p>

        {proven.map(({ skill, score }) => {
          const applied = newestFirst(student.evidence).filter((e) => e.competencyId === skill.id && e.excerpt).slice(0, 2);
          const change = growth(student.evidence, skill.id);
          const last = lastProven(student.evidence, skill.id)!;
          const age = daysSince(last);
          const vouches = endorsements.filter((e) => e.competencyId === skill.id);
          return (
            <section className="panel stack" key={skill.id}>
              <div className="row between">
                <h2>{skill.name}</h2>
                <div className="row" style={{ gap: "0.75rem" }}>
                  <strong>{score}, {levelName(score)}</strong>
                  <TrustLabel value={skillTrust(student.evidence, student.claims, skill.id)} />
                </div>
              </div>
              <p className="small">
                {change && change.to !== change.from && (
                  <span className={change.to > change.from ? "delta up" : "delta down"}>{change.to > change.from ? "+" : ""}{change.to - change.from} since {formatDate(change.since)}. </span>
                )}
                <span className={age > STALE_AFTER_DAYS ? "status mid" : "muted"}>Last proven {formatDate(last)}{age > STALE_AFTER_DAYS ? `, ${age} days ago` : ""}</span>
              </p>
              {vouches.map((v) => <EndorsementItem key={v.id} item={v} />)}
              {applied.length === 0 ? (
                <p className="muted small">Assessment results only, with no applied work yet.</p>
              ) : (
                applied.map((item) => <EvidenceItem key={item.id} item={item} />)
              )}
            </section>
          );
        })}
      </div></main>
    </>
  );
}
