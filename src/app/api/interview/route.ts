import { NextResponse } from "next/server";
import { streamedReply } from "@/lib/ai";
import { ChatBody, studentContext } from "@/lib/chat";
import { getStudent } from "@/lib/store";

export async function POST(request: Request) {
  const parsed = ChatBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write an answer first." }, { status: 400 });

  const system =
    "You are conducting a mock entry-level job interview. Ask exactly one question at a time, " +
    "with no preamble and no feedback between questions. Mix technical and behavioural questions, " +
    "focus on the skills with the largest gaps below, and follow up when an answer is vague.\n\n" +
    studentContext((await getStudent()));

  return streamedReply(system, parsed.data.messages);
}
