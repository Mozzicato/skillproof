import { BadgeCheck, GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/Brand";

const POINTS = [
  { icon: BadgeCheck, text: "Every skill score links to the work behind it." },
  { icon: ShieldCheck, text: "Defend your projects to raise how far employers trust them." },
  { icon: GraduationCap, text: "See exactly what to learn next for the role you want." },
];

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-body">
          <h2>Prove what you can do, not just what you claim.</h2>
          <ul className="auth-points">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text}><Icon size={20} aria-hidden="true" />{text}</li>
            ))}
          </ul>
        </div>
        <p className="small">Judging the hackathon? <Link href="/student">Open the judge demo</Link> instead.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{intro}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
