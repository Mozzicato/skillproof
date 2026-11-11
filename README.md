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

## Checks

```
npm test
npm run typecheck
npm run build
```
