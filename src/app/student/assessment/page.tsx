import { AssessmentFlow } from "@/components/Assessment";
import { PageHead } from "@/components/ui";
import { calibrationLabel, latestRun } from "@/lib/calibration";
import { assessmentTask, competency, role } from "@/lib/framework";
import { getStudent } from "@/lib/store";

export default async function AssessmentPage() {
  const student = await getStudent();
  const target = role(student.targetRoleId);
  const reassess = student.evidence.some((e) => e.source === "assessment");
  const last = latestRun(student.assessments);
  const task = assessmentTask(target.id);
  return (
    <div className="stack-lg">
      <PageHead
        title={reassess ? "Reassess your skills" : "Career assessment"}
        intro={`Rate yourself, answer adaptive questions on each skill a ${target.title} needs, then do one short task. About fifteen minutes.`}
      />
      <div className="panel">
        <AssessmentFlow
          skills={target.requirements.map((r) => r.competencyId)}
          initialClaims={Object.fromEntries(student.claims.map((c) => [c.competencyId, c.level]))}
          task={{ prompt: task.prompt, skill: competency(task.competencyId).name }}
          previousCalibration={last?.calibration ?? null}
          previousLabel={last ? calibrationLabel(last) : null}
          reassess={reassess}
        />
      </div>
    </div>
  );
}
