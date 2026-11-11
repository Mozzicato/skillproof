import { Coach } from "@/components/client";
import { PageHead } from "@/components/ui";

export default function CoachPage() {
  return (
    <div>
      <PageHead title="Career coach" intro="Advice based on your evidence record, not on what your CV says." />
      <Coach suggestions={["What should I work on first?", "Am I ready to apply for internships?", "How do I prove my SQL skills?"]} />
    </div>
  );
}
