import Link from "next/link";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/client";
import { CvDocument } from "@/components/CvDocument";
import { siteOrigin } from "@/components/passport";
import { getStudent } from "@/lib/store";

/** The optimised CV on its own, so printing it saves a clean one-page PDF. */
export default async function CvPrintPage() {
  const student = await getStudent();
  if (!student.optimisedCv) redirect("/student/resume");
  return (
    <div className="stack">
      <div className="row between no-print">
        <Link href="/student/resume">Back to your CV</Link>
        <PrintButton />
      </div>
      <CvDocument student={student} cv={student.optimisedCv} passportUrl={`${await siteOrigin()}/p/${student.id}`} />
    </div>
  );
}
