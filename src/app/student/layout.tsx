import Link from "next/link";
import { ResetDemo, RoleSelect } from "@/components/client";
import { StudentNav } from "@/components/StudentNav";
import { ROLES, role } from "@/lib/framework";
import { cycleStatus } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = getStudent();
  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/" className="brand">SkillProof</Link>
        <StudentNav steps={cycleStatus(role(student.targetRoleId), student)} />
        <div className="rail-foot">
          <strong style={{ color: "#fff" }}>{student.name}</strong>
          <span>{student.department}</span>
          <RoleSelect value={student.targetRoleId} roles={ROLES.map((r) => ({ id: r.id, title: r.title }))} />
          <Link href={`/p/${student.id}`}>View public portfolio</Link>
          <div><ResetDemo /></div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
