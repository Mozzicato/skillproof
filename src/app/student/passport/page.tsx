import Link from "next/link";
import { CopyText } from "@/components/client";
import { InviteLink } from "@/components/cycle";
import { EndorsementItem, QrCode, siteOrigin } from "@/components/passport";
import { PageHead } from "@/components/ui";
import { competency } from "@/lib/framework";
import { getStudent } from "@/lib/store";

export default async function PassportSharePage() {
  const student = await getStudent();
  const url = `${await siteOrigin()}/p/${student.id}`;
  const endorsements = student.endorsements ?? [];

  return (
    <div className="stack-lg">
      <PageHead title="Skill Passport" intro="One link, or a QR code on your CV, that shows employers every score with the work behind it." />
      <section className="panel passport-share">
        <QrCode url={url} label="QR code linking to your Skill Passport" />
        <div className="stack">
          <h2>Your public link</h2>
          <code className="excerpt" style={{ wordBreak: "break-all" }}>{url}</code>
          <div className="row">
            <CopyText text={url} label="Copy link" />
            <Link className="btn quiet btn-sm" href={`/p/${student.id}`}>Open as an employer sees it</Link>
          </div>
          <p className="small muted">Print the code on your CV. Anyone who scans it sees your evidence, your self-awareness score and who has confirmed your skills.</p>
        </div>
      </section>

      <section className="panel stack">
        <h2>Ask someone to confirm your skills</h2>
        <p className="muted">A lecturer who marked your work, a placement supervisor, or an interviewer can confirm skills they saw you use. They can only confirm skills you already have evidence for, so a confirmation adds weight to proof and never replaces it.</p>
        <InviteLink />
      </section>

      <section className="panel stack">
        <h2>Confirmations received</h2>
        {endorsements.length === 0 ? (
          <p className="muted">None yet. Create a link above and send it to someone who has seen your work.</p>
        ) : (
          <ul className="list">
            {endorsements.map((e) => (
              <li key={e.id} className="stack" style={{ gap: "0.4rem" }}>
                <h3>{competency(e.competencyId).name}</h3>
                <EndorsementItem item={e} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
