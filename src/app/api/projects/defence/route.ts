import { NextResponse } from "next/server";
import { DATA_RULE, streamedReply, studentWork } from "@/lib/ai";
import { DefenceBody } from "@/lib/chat";
import { project } from "@/lib/framework";
import { getStudent } from "@/lib/store";

export async function POST(request: Request) {
  const parsed = DefenceBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write an answer first." }, { status: 400 });

  const evaluation = (await getStudent()).evaluations.find((e) => e.id === parsed.data.evaluationId);
  if (!evaluation?.submission) return NextResponse.json({ error: "This project has no submission to defend." }, { status: 404 });
  if (evaluation.defence) return NextResponse.json({ error: "This project has already been defended." }, { status: 409 });

  const system =
    "You are examining a student to find out whether they wrote and understand the project below. " +
    "Ask exactly one short question at a time, three in total, with no preamble and no feedback. " +
    "Spend one question on each rubric criterion, in order. " +
    "Each question must be hard to answer without having done the work: why they made a specific choice, " +
    "what would break if a specific line changed, or how they would extend a specific part. " +
    "Quote the part of their work you are asking about. " +
    DATA_RULE +
    `\n\nProject: ${project(evaluation.projectId)?.title}\n\nRubric:\n` +
    evaluation.results.map((r) => `- ${r.criterion}`).join("\n") +
    `\n\n${studentWork(evaluation.submission)}`;

  return streamedReply(system, parsed.data.messages);
}
