import Link from "next/link";
import { SignOutButton } from "@/components/AuthForms";
import { DemoSwitch, ResetDemo, RoleSelect } from "@/components/client";
import { StudentNav } from "@/components/StudentNav";
import { ROLES, role } from "@/lib/framework";
import { sampleStudents } from "@/lib/roster";
import { cycleStatus } from "@/lib/scoring";
import { getStudent, getViewer, sampleBase } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const [student, viewer] = await Promise.all([getStudent(), getViewer()]);
  const demo = viewer.mode === "demo";
  return (
    <div className="shell">
      <aside className="rail">
        <StudentNav steps={cycleStatus(role(student.targetRoleId), student)} />
      </aside>
      <div className="page">
        {demo && (
          <div className="demo-banner" role="note">
            <span className="badge judge">Judge demo</span>
            <span>You are viewing a sample student with work already scored. Your changes stay private to this browser.</span>
            <DemoSwitch
              current={sampleBase(student.id)}
              students={sampleStudents().map((s) => ({ id: s.id, label: `${s.name}, ${s.department}, ${role(s.targetRoleId).title.replace("Junior ", "")}` }))}
            />
            <Link href="/signup">Create your own account</Link>
          </div>
        )}
        <header className="appbar">
          <div className="appbar-who">
            <strong>{student.name}</strong>
            <span className="muted">{student.department}</span>
          </div>
          <div className="appbar-tools">
            <RoleSelect value={student.targetRoleId} roles={ROLES.map((r) => ({ id: r.id, title: r.title }))} />
            <Link href={`/p/${student.id}`}>Public portfolio</Link>
            {demo ? <ResetDemo /> : <SignOutButton />}
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
