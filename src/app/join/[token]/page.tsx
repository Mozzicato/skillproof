import Link from "next/link";
import { JoinCoach } from "@/components/cycle";
import { SiteHeader } from "@/components/SiteHeader";
import { getStudent, getViewer, openCoachInvite } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [opened, viewer, student] = await Promise.all([openCoachInvite(token), getViewer(), getStudent()]);

  return (
    <>
      <SiteHeader section="Share your progress" />
      <main className="wide-page"><div className="wide stack-lg" style={{ maxWidth: 680 }}>
        {!opened ? (
          <div className="empty"><h1>This link is not valid</h1><p>Ask your coach to send it again.</p></div>
        ) : (
          <section className="panel stack">
            <h1>{opened.coach.name} invited you to share your progress</h1>
            <p>Your coach will see your readiness, your evidenced skill scores, your self-awareness score, your current sprint and when you last added evidence. They cannot change anything.</p>
            {viewer.mode === "demo" ? (
              <p className="notice">You are using the judge demo, so you will share as the sample student {student.name}. <Link href="/signup">Create an account</Link> to share your own record.</p>
            ) : (
              <p className="muted">You will share as {student.name}.</p>
            )}
            {student.coach?.name === opened.coach.name ? <p className="status good">You already share your progress with {opened.coach.name}.</p> : <JoinCoach token={token} />}
          </section>
        )}
      </div></main>
    </>
  );
}
