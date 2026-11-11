import { NextResponse } from "next/server";
import { streamedReply } from "@/lib/ai";
import { ChatBody, studentContext } from "@/lib/chat";
import { getStudent } from "@/lib/store";

export async function POST(request: Request) {
  const parsed = ChatBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a message first." }, { status: 400 });

  const system =
    "You are a career coach for a university student on SkillProof. " +
    "Base your advice on the evidence record below, name the specific skills involved, " +
    "and be honest when the evidence is thin. Keep replies under 150 words, in plain language, " +
    "and end with one concrete next action.\n\n" +
    studentContext((await getStudent()));

  return streamedReply(system, parsed.data.messages);
}
