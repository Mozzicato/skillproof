import { NextResponse } from "next/server";
import { z } from "zod";
import { PER_SKILL, nextQuestion } from "@/lib/assessment";
import { role } from "@/lib/framework";
import { question } from "@/lib/questions";
import { getStudent } from "@/lib/store";

const Body = z.object({
  answers: z.array(z.object({ questionId: z.string(), choice: z.string() })).max(40),
});

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Serves the next adaptive question. The correct answer and the difficulty never leave the server. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The answers could not be read. Reload the page." }, { status: 400 });

  const student = await getStudent();
  const skills = role(student.targetRoleId).requirements.map((r) => r.competencyId);
  const seen = new Set((student.assessments ?? []).flatMap((run) => run.questionIds));
  const answered = parsed.data.answers.map((a) => {
    const q = question(a.questionId);
    return { questionId: a.questionId, correct: q ? q.options[q.answerIndex] === a.choice : false };
  });

  const next = nextQuestion(skills, answered, seen);
  const total = skills.length * PER_SKILL;
  if (!next) return NextResponse.json({ done: true, total });
  return NextResponse.json({
    done: false,
    total,
    question: { id: next.id, competencyId: next.competencyId, prompt: next.prompt, options: shuffle(next.options), fresh: !seen.has(next.id) },
  });
}
