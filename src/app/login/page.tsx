import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (await currentUser()) redirect("/student");
  return (
    <AuthShell title="Sign in" intro="Pick up where you left off.">
      <SignInForm />
    </AuthShell>
  );
}
