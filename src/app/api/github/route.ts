import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({ url: z.string().max(300) });

const CODE = /\.(py|js|jsx|ts|tsx|sql|r|md)$/i;
const SKIP = /(^|\/)(node_modules|dist|build|vendor|\.next|venv|__pycache__)\/|\.min\.|package-lock|yarn\.lock|pnpm-lock/i;
const MAX_FILES = 10;
const MAX_CHARS = 30000;

function headers(): HeadersInit {
  const h: Record<string, string> = { "User-Agent": "SkillProof", Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function github<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: headers(), cache: "no-store" });
  if (response.status === 404) throw new Error("That repository was not found. Check the link and that the repository is public.");
  if (response.status === 403 || response.status === 429) throw new Error("GitHub is limiting requests right now. Try again in a few minutes, or paste your code instead.");
  if (!response.ok) throw new Error("GitHub did not respond. Try again, or paste your code instead.");
  return response.json() as Promise<T>;
}

/** Reads a public repository's code and recent commit messages, so the evaluator grades real work rather than a pasted excerpt. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  const match = parsed.success ? parsed.data.url.trim().match(/^(?:https?:\/\/)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i) : null;
  if (!match) return NextResponse.json({ error: "Enter a public GitHub repository link, such as https://github.com/name/project." }, { status: 400 });
  const [, owner, repo] = match;

  try {
    const info = await github<{ default_branch: string }>(`/repos/${owner}/${repo}`);
    const branch = info.default_branch;
    const tree = await github<{ tree: { path: string; type: string; size?: number }[] }>(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    const files = tree.tree
      .filter((f) => f.type === "blob" && CODE.test(f.path) && !SKIP.test(f.path) && (f.size ?? 0) < 40000)
      .sort((a, b) => Number(/readme/i.test(b.path)) - Number(/readme/i.test(a.path)) || a.path.split("/").length - b.path.split("/").length)
      .slice(0, MAX_FILES);
    if (files.length === 0) return NextResponse.json({ error: "No code files were found in that repository." }, { status: 422 });

    let text = "";
    for (const file of files) {
      const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${file.path.split("/").map(encodeURIComponent).join("/")}`, { cache: "no-store" });
      if (!raw.ok) continue;
      const body = await raw.text();
      const block = `=== FILE: ${file.path} ===\n${body.trim()}\n\n`;
      if (text.length + block.length > MAX_CHARS) break;
      text += block;
    }
    const commits = await github<{ commit: { message: string } }[]>(`/repos/${owner}/${repo}/commits?per_page=15`).catch(() => []);
    if (commits.length) text += `=== COMMIT MESSAGES (newest first) ===\n${commits.map((c) => `- ${c.commit.message.split("\n")[0]}`).join("\n")}\n`;

    return NextResponse.json({ text: text.slice(0, 40000), link: `https://github.com/${owner}/${repo}`, files: files.length, commits: commits.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The repository could not be read." }, { status: 502 });
  }
}
