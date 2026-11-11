import { AssessmentForm } from "@/components/Assessment";
import { PageHead } from "@/components/ui";
import { QUESTIONS, role } from "@/lib/framework";
import { getStudent } from "@/lib/store";

export default async function AssessmentPage() {
  const student = (await getStudent());
  const target = role(student.targetRoleId);
  const ids = new Set(target.requirements.map((r) => r.competencyId));
  const reassess = student.evidence.some((e) => e.source === "assessment");
  return (
    <div>
      <PageHead
        title={reassess ? "Reassess your skills" : "Career assessment"}
        intro={`Questions on each skill a ${target.title} needs. Your results become evidence and update your scores.`}
      />
      <div className="panel">
        <AssessmentForm questions={QUESTIONS.filter((q) => ids.has(q.competencyId))} label="Save my results" />
      </div>
    </div>
  );
}
