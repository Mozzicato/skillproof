# SkillProof

A career readiness platform that scores student skills from evidence, not claims.

## Run it

```
npm install
copy .env.example .env
npm run dev
```

Add a Groq or Claude API key to `.env`, then open http://localhost:3000. The assessment, skill gaps, progress, job matching, portfolio, university and employer screens work without a key. The career coach, project evaluator, mock interview and CV check need one.

## What is sample data

Sam Okoro is a sample student. The 2,000 students on the university and employer screens are simulated, and the employers and vacancies are fictional. The screens say so. Use "Reset sample data" in the student portal to restore the starting state before a demo.

## How a score is earned

- A claim on a CV never raises a score.
- Each evidence item is weighted by source (project, then interview, then assessment) and by how recent it is. See `src/lib/scoring.ts`.
- AI evaluators must quote the student's own work. If the quote is not found word for word, the criterion scores zero and no evidence is recorded.
- After a project is evaluated, the student can defend it by answering three questions about their own submission, once per submission. Defended work counts for more. Work the student cannot explain is capped at 25.
- Every skill shows the strongest proof behind it: Defended, AI-evaluated, Assessed, Could not defend, or Claimed only.

## The cycle, stage by stage

- **Assess.** The student rates each skill first, then answers adaptive questions. Each skill starts with a medium question and moves to a hard or easy one. The student says how sure they are of every answer. Lucky guesses count for less, and confident mistakes cost more. The result includes a self-awareness score showing how closely confidence matched results, and one AI-graded applied task. The answers and the difficulty never leave the server (`src/lib/questions.ts`), and the server rejects any answers that do not follow the adaptive path.
- **Identify.** Gaps are ranked by what closing them is worth: first vacancies where the gap is the only thing missing, then vacancies it holds the student back from, then how often it is asked for.
- **Develop.** A two-week sprint names the gap and the exact proof that will close it, which is a project criterion score, a defence and a reassessment. Each step is ticked only when the evidence arrives.
- **Demonstrate.** Project work can be imported from a public GitHub repository, including recent commit messages.
- **Reassess.** Reassessments prefer questions the student has not seen before. Evidence older than 60 days is flagged on the passport until the skill is proven again. The passport shows how much each skill has grown since the first evidence for it.
- **Connect.** The Skill Passport is a public page with a QR code. A student can send a lecturer, mentor or interviewer a single-use private link to confirm skills they saw. Confirmations are only possible for skills that already have evidence, and they appear on the passport with the person's name and organisation as entered. Employers see self-awareness and confirmations in search results.

## For judges

- **Guided tour.** "Take the 3-minute tour" on the home page walks through eleven stops, from claims against proof to pricing.
- **Eleven sample students** with full records cover every department and both roles. "Explore as" in the demo banner switches between them.
- **Verified confirmations.** People confirming a skill enter a work email and a six-digit code. The passport shows only the email domain. Codes are sent with Resend when `RESEND_API_KEY` is set (and `EMAIL_FROM` optionally); without it the code is shown on screen, labelled as demo mode.
- **Coach tools** (`/coach`). A coach shares one link, and up to five learners on the Free plan can choose to share their progress.
- **CV upload and optimised CV.** Students upload a PDF, Word (.docx) or text CV; the text is read on the server and the file is not stored. "Generate my optimised CV" writes a CV for the target role: skill levels come only from evidence, and every experience and education line must quote the student's own CV word for word or it is dropped. It downloads as a PDF.
- **Plans** (`/pricing`). Free and Pro at $29.99 a year. Upgrading uses a practice checkout: no card details, no payment.

## Checks

```
npm test
npm run typecheck
npm run build
```
