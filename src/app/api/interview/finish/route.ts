import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { ChatBody } from "@/lib/chat";
import { competency, role } from "@/lib/framework";
import { clampScore, isGrounded } from "@/lib/scoring";
import { getStudent, saveStudent } from "@/lib/store";
import { COMPETENCY_IDS, type Evidence } from "@/lib/types";

const Review = z.object({
  feedback: z.string(),
  skills: z.array(
    z.object({
      competencyId: z.enum(COMPETENCY_IDS),
      band: z.number().int().describe("0 absent, 1 weak, 2 partial, 3 solid, 4 excellent"),
      rationale: z.string(),
      excerpt: z.string().describe("A verbatim quote copied from one of the candidate's answers"),
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = ChatBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Answer at least one question first." }, { status: 400 });

  const answers = parsed.data.messages.filter((m) => m.role === "user").slice(1).map((m) => m.content);
  if (answers.length === 0) return NextResponse.json({ error: "Answer at least one question first." }, { status: 400 });

  const student = (await getStudent());
  const target = role(student.targetRoleId);
  const allowed = target.requirements.map((r) => r.competencyId);

  try {
    const transcript = parsed.data.messages
      .slice(1)
      .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
      .join("\n\n");

    const review = await structured({
      schema: Review,
      system:
        `You review a mock interview for the role ${target.title}. ` +
        "Assess only skills the candidate's own answers actually show, from this list of ids: " +
        `${allowed.join(", ")}. Leave out skills the answers do not touch. ` +
        "Quote the candidate's answer word for word as the excerpt. " +
        "In the feedback, give two sentences on what to improve. " +
        DATA_RULE,
      user: studentWork(transcript),
    });

    const answerText = answers.join("\n");
    const createdAt = new Date().toISOString();
    const evidence: Evidence[] = review.skills
      .filter((s) => allowed.includes(s.competencyId) && isGrounded(s.excerpt, answerText))
      .map((s, i) => ({
        id: `interview-${Date.now()}-${i}`,
        competencyId: s.competencyId,
        source: "interview",
        score: clampScore(s.band, 4) * 25,
        title: "Mock interview",
        rationale: s.rationale,
        excerpt: s.excerpt,
        createdAt,
      }));

    await saveStudent({ ...student, evidence: [...student.evidence, ...evidence] });
    return NextResponse.json({
      feedback: review.feedback,
      skills: evidence.map((e) => ({ name: competency(e.competencyId).name, score: e.score, rationale: e.rationale })),
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
