import { NextResponse } from "next/server";
import { resetStudent } from "@/lib/store";

export async function POST() {
  resetStudent();
  return NextResponse.json({ ok: true });
}
