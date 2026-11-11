import { VouchForm } from "@/components/cycle";
import { SiteHeader } from "@/components/SiteHeader";
import { COMPETENCIES } from "@/lib/framework";
import { competencyScore, newestFirst } from "@/lib/scoring";
import { openInvite } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function VouchPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const opened = await openInvite(token);

  return (
    <>
      <SiteHeader section="Confirm a student's skills" />
      <main className="wide-page"><div className="wide stack-lg" style={{ maxWidth: 760 }}>
        {!opened ? (
          <div className="empty"><h1>This link is not valid</h1><p>Ask the student to send you a new one.</p></div>
        ) : opened.invite.usedAt ? (
          <div className="empty"><h1>This link has already been used</h1><p>Each link can confirm skills once. Ask the student for a new link if you need to add more.</p></div>
        ) : (
          <>
            <header className="page-head">
              <h1>{opened.student.name} asked you to confirm their skills</h1>
              <p className="muted">
                {opened.student.department}, {opened.student.university}. Confirm only skills you have seen them use yourself.
                Your name, organisation and statement will appear on their public Skill Passport exactly as you enter them.
              </p>
            </header>
            <section className="panel stack">
              <h2>Their evidence so far</h2>
              <ul className="list">
                {COMPETENCIES.flatMap((c) => {
                  const score = competencyScore(opened.student.evidence, c.id);
                  if (score === null) return [];
                  const quote = newestFirst(opened.student.evidence).find((e) => e.competencyId === c.id && e.excerpt)?.excerpt;
                  return [
                    <li key={c.id} className="stack" style={{ gap: "0.3rem" }}>
                      <div className="row between"><strong>{c.name}</strong><span>{score}</span></div>
                      {quote && <div><code className="excerpt">{quote}</code></div>}
                    </li>,
                  ];
                })}
              </ul>
            </section>
            <section className="panel stack">
              <h2>Your confirmation</h2>
              <VouchForm
                token={token}
                skills={COMPETENCIES.flatMap((c) => {
                  const score = competencyScore(opened.student.evidence, c.id);
                  return score === null ? [] : [{ id: c.id, name: c.name, score }];
                })}
              />
            </section>
          </>
        )}
      </div></main>
    </>
  );
}
