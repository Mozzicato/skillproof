import { Interview } from "@/components/client";
import { PageHead } from "@/components/ui";
import { role } from "@/lib/framework";
import { getStudent } from "@/lib/store";

export default function InterviewPage() {
  const target = role(getStudent().targetRoleId);
  return (
    <div>
      <PageHead title="Mock interview" intro={`Practise for a ${target.title} role. Questions focus on your largest gaps, and scored answers join your evidence record.`} />
      <Interview />
    </div>
  );
}
