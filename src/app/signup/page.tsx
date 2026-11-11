import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignUpForm } from "@/components/AuthForms";
import { currentUser } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/cohort";
import { ROLES } from "@/lib/framework";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (await currentUser()) redirect("/student");
  return (
    <AuthShell title="Create your account" intro="Your account starts empty. Take the assessment first, and every score after that comes from your own work.">
      <SignUpForm departments={DEPARTMENTS.map((d) => d.name)} roles={ROLES.map((r) => ({ id: r.id, title: r.title }))} />
    </AuthShell>
  );
}
