import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/store";

export async function POST() {
  if (!(await resetDemo())) {
    return NextResponse.json({ error: "Only the judge demo can be reset. Sign out to use it." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
