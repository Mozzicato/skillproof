import { DEMO_STUDENT_ID, seedStudent } from "./seed";
import { project } from "./framework";
import type {
  AssessmentRun,
  CompetencyId,
  DefenceOutcome,
  Endorsement,
  EndorserRole,
  Evidence,
  ProjectEvaluation,
  Sprint,
  Student,
} from "./types";

/**
 * Sample students with complete records, so the employer search, university view and
 * passports have real portfolios to open. All of them, and every person and company
 * vouching for them, are fictional.
 */

type RunSkill = [CompetencyId, number | null, number];
type Result = [criterionId: string, score: number, excerpt: string, rationale: string, defence?: "defended" | "failed"];

interface Spec {
  id: string;
  name: string;
  department: string;
  targetRoleId: string;
  claims: [CompetencyId, number, string][];
  runs: { date: string; calibration: number; over: number; under: number; skills: RunSkill[] }[];
  projects?: { projectId: string; date: string; submission: string; summary: string; nextStep: string; results: Result[]; defence?: { date: string; feedback: string } }[];
  interviews?: { date: string; skills: [CompetencyId, number, string, string][] }[];
  endorsements?: { competencyId: CompetencyId; name: string; role: EndorserRole; organisation: string; statement: string; date: string; project?: number; domain?: string }[];
  sprint?: Sprint;
}

const PATH: Record<number, string> = {
  90: "Adaptive: medium question right, then hard question right.",
  60: "Adaptive: medium question right, then hard question wrong.",
  35: "Adaptive: medium question wrong, then easy question right.",
  10: "Adaptive: medium question wrong, then easy question wrong.",
};

const at = (date: string) => `${date}T10:00:00.000Z`;

function build(spec: Spec): Student {
  const evidence: Evidence[] = [];
  const add = (e: Omit<Evidence, "id">) => evidence.push({ id: `e${evidence.length + 1}`, ...e });

  const assessments: AssessmentRun[] = spec.runs.map((run, i) => {
    run.skills.forEach(([competencyId, , score]) =>
      add({ competencyId, source: "assessment", score, title: i === 0 ? "Baseline assessment" : "Reassessment", rationale: PATH[score] ?? "Adaptive assessment.", createdAt: at(run.date) }),
    );
    return {
      id: `run-${i + 1}`,
      createdAt: at(run.date),
      questionIds: [],
      calibration: run.calibration,
      overconfident: run.over,
      underconfident: run.under,
      answered: run.skills.length * 2,
      skills: run.skills.map(([competencyId, claimed, measured]) => ({ competencyId, claimed, measured })),
    };
  });

  const evaluations: ProjectEvaluation[] = (spec.projects ?? []).map((p, i) => {
    const brief = project(p.projectId)!;
    const id = `eval-${i + 1}`;
    const results = p.results.map(([criterionId, score, excerpt, rationale]) => {
      const rubric = brief.rubric.find((r) => r.id === criterionId)!;
      return { criterionId, competencyId: rubric.competencyId, criterion: rubric.criterion, score, rationale, excerpt, verified: true };
    });
    results.forEach((r, j) =>
      add({
        competencyId: r.competencyId,
        source: "project",
        score: r.score,
        title: brief.title,
        criterion: r.criterion,
        rationale: r.rationale,
        excerpt: r.excerpt,
        evaluationId: id,
        criterionId: r.criterionId,
        defence: p.results[j][4],
        createdAt: at(p.date),
      }),
    );
    const outcomes: DefenceOutcome[] = p.results.map(([criterionId, score, excerpt, , result], j) => ({
      criterionId,
      competencyId: results[j].competencyId,
      band: result === "defended" ? Math.max(score, 70) : result === "failed" ? 20 : 50,
      rationale: result === "defended" ? "Explained the choice in their own words and answered the follow-up." : result === "failed" ? "Could not explain what this part of the work does." : "Not covered by the questions.",
      excerpt: result ? excerpt : null,
      result: result ?? "not-covered",
    }));
    return {
      id,
      projectId: p.projectId,
      submission: p.submission,
      summary: p.summary,
      nextStep: p.nextStep,
      results,
      createdAt: at(p.date),
      defence: p.defence ? { feedback: p.defence.feedback, outcomes, createdAt: at(p.defence.date) } : undefined,
    };
  });

  (spec.interviews ?? []).forEach((iv) =>
    iv.skills.forEach(([competencyId, score, excerpt, rationale]) =>
      add({ competencyId, source: "interview", score, title: "Mock interview", rationale, excerpt, createdAt: at(iv.date) }),
    ),
  );

  const endorsements: Endorsement[] = (spec.endorsements ?? []).map((e, i) => ({
    id: `end-${i + 1}`,
    competencyId: e.competencyId,
    name: e.name,
    role: e.role,
    organisation: e.organisation,
    statement: e.statement,
    evaluationId: e.project === undefined ? undefined : evaluations[e.project].id,
    createdAt: at(e.date),
    verified: e.domain ? { domain: e.domain, work: true, at: at(e.date) } : undefined,
  }));

  return {
    id: spec.id,
    name: spec.name,
    department: spec.department,
    university: "Sample University",
    targetRoleId: spec.targetRoleId,
    claims: spec.claims.map(([competencyId, level, text]) => ({ competencyId, level, text })),
    evidence: evidence.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    evaluations,
    cvFeedback: null,
    assessments,
    sprint: spec.sprint ?? null,
    endorsements,
  };
}

const SPECS: Spec[] = [
  {
    id: "amina-bello",
    name: "Amina Bello",
    department: "Computer Science",
    targetRoleId: "software-developer",
    claims: [
      ["javascript", 80, "Full-stack JavaScript developer"],
      ["git-testing", 70, "Writes automated tests for everything"],
      ["problem-solving", 75, "Strong analytical problem solver"],
      ["communication", 65, "Clear communicator in team settings"],
    ],
    runs: [
      { date: "2026-09-15", calibration: 82, over: 1, under: 2, skills: [["javascript", 80, 60], ["python", null, 60], ["git-testing", 70, 60], ["sql", null, 35], ["communication", 65, 60], ["problem-solving", 75, 90]] },
      { date: "2026-11-05", calibration: 91, over: 0, under: 1, skills: [["javascript", 80, 90], ["git-testing", 70, 90]] },
    ],
    projects: [
      {
        projectId: "tasks-api",
        date: "2026-10-12",
        submission: `// POST /tasks creates a task, GET /tasks lists them
export async function handler(req, store) {
  if (req.method === "GET") return { status: 200, body: await store.list() };
  if (req.method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title) return { status: 400, body: { error: "title is required" } };
  if (title.length > 200) return { status: 400, body: { error: "title is too long" } };
  try {
    const task = await store.create({ title, done: false });
    return { status: 201, body: task };
  } catch (err) {
    return { status: 503, body: { error: "Could not save the task, try again" } };
  }
}

test("rejects a blank title", async () => {
  const res = await handler({ method: "POST", body: { title: "   " } }, fakeStore());
  expect(res.status).toBe(400);
});

test("returns 503 when the store fails", async () => {
  const res = await handler({ method: "POST", body: { title: "Ship it" } }, failingStore());
  expect(res.status).toBe(503);
});

Commits:
- add GET /tasks with an empty list test
- reject blank and overlong titles
- return 503 when the store throws`,
        summary: "A careful handler that validates input, separates storage failures from bad requests, and is backed by tests for both.",
        nextStep: "Add a test for the GET route returning existing tasks in creation order.",
        results: [
          ["c1", 85, `if (!title) return { status: 400, body: { error: "title is required" } };`, "Trims and type-checks the title before saving, and catches storage errors.", "defended"],
          ["c2", 80, `test("returns 503 when the store fails"`, "Tests cover the failure paths, and each commit names one change.", "defended"],
          ["c3", 80, "if (title.length > 200)", "Blank, non-string and overlong titles are each handled on purpose.", "defended"],
        ],
        defence: { date: "2026-10-13", feedback: "Amina explained why a storage failure returns 503 rather than 400, and how the fake store makes the failure test possible." },
      },
    ],
    interviews: [
      { date: "2026-10-28", skills: [
        ["communication", 75, "I would tell the product manager what breaks for the user first, then what it costs to fix", "Led with the impact on users before the technical detail."],
        ["problem-solving", 85, "I reproduced it with the smallest input first, an empty title, before touching the code", "Narrowed the bug methodically before changing anything."],
      ] },
    ],
    endorsements: [
      { competencyId: "javascript", name: "Joanna Pike", role: "Employer", organisation: "Fieldnote Labs", statement: "Amina joined our team for a one-week trial. She wrote the input validation and its tests herself and walked us through every failure case.", date: "2026-10-30", project: 0, domain: "fieldnotelabs.example" },
      { competencyId: "git-testing", name: "Dr Kunle Adeyemi", role: "Lecturer", organisation: "Sample University, Department of Computer Science", statement: "Her coursework repository had the clearest commit history in the class, and the tests actually failed when I broke the code.", date: "2026-11-06", domain: "sample-university.example" },
    ],
  },
  {
    id: "priya-patel",
    name: "Priya Patel",
    department: "Statistics",
    targetRoleId: "data-analyst",
    claims: [
      ["sql", 70, "Confident with SQL joins and window functions"],
      ["statistics", 80, "Strong statistical reasoning"],
      ["python", 70, "Python for analysis with pandas"],
      ["visualisation", 65, "Builds clear charts"],
      ["communication", 70, "Presents findings to non-technical audiences"],
    ],
    runs: [
      { date: "2026-09-10", calibration: 84, over: 1, under: 2, skills: [["sql", 70, 60], ["python", 70, 60], ["data-wrangling", null, 60], ["visualisation", 65, 60], ["statistics", 80, 90], ["communication", 70, 60], ["problem-solving", null, 60]] },
      { date: "2026-11-03", calibration: 90, over: 0, under: 1, skills: [["sql", 70, 90], ["data-wrangling", null, 90]] },
    ],
    projects: [
      {
        projectId: "sql-retention",
        date: "2026-10-02",
        submission: `-- First order per customer, then whether they ordered again within 90 days
WITH first_orders AS (
  SELECT customer_id, MIN(order_date) AS first_date
  FROM orders
  GROUP BY customer_id
),
returned AS (
  SELECT f.customer_id
  FROM first_orders f
  JOIN orders o ON o.customer_id = f.customer_id
   AND o.order_date > f.first_date
   AND o.order_date <= f.first_date + INTERVAL '90 days'
  GROUP BY f.customer_id
)
SELECT COUNT(r.customer_id) * 1.0 / COUNT(f.customer_id) AS return_rate
FROM first_orders f
LEFT JOIN returned r ON r.customer_id = f.customer_id
WHERE f.first_date <= CURRENT_DATE - INTERVAL '90 days';

Recommendation: 31% of customers order again within 90 days. Customers who signed up in the last 90 days are excluded because they have not had a full window yet. Most who return do so within 30 days, so a reminder at day 21 is the cheapest test. This is one year of data, so seasonality could move the rate.`,
        summary: "Correct 90-day window, recent customers excluded on purpose, and a recommendation that follows from the timing of returns.",
        nextStep: "Split the rate by signup month to check the seasonality you mention.",
        results: [
          ["c1", 85, "LEFT JOIN returned r ON r.customer_id = f.customer_id", "Keeps customers who never returned in the denominator and bounds the window correctly.", "defended"],
          ["c2", 85, "Customers who signed up in the last 90 days are excluded because they have not had a full window yet.", "Spots the censoring problem that most answers miss.", "defended"],
          ["c3", 75, "a reminder at day 21 is the cheapest test", "Specific action tied to when customers return.", "defended"],
        ],
        defence: { date: "2026-10-03", feedback: "Priya explained why the LEFT JOIN matters for the denominator and what would bias the rate upwards." },
      },
      {
        projectId: "dashboard-brief",
        date: "2026-10-24",
        submission: `Question: which courses need a conversation this month?

Chart 1: small multiples, one line per course, weekly attendance rate for the term, same y-axis from 0 to 100% so drops are comparable.
Chart 2: a sorted bar chart of the change in attendance between weeks 1-3 and the last three weeks. Courses that fell more than 10 points are highlighted.
I avoided a pie chart because the parts do not add up to a whole.
Title: Four courses lost more than 10 points of attendance since week 3.`,
        summary: "The report is scoped to one decision and the encodings are honest.",
        nextStep: "Add the number of enrolled students to each course so small courses are not over-read.",
        results: [
          ["c1", 80, "same y-axis from 0 to 100% so drops are comparable", "Shared axes and a sorted change chart answer the question directly."],
          ["c2", 75, "Question: which courses need a conversation this month?", "Starts from the decision the head of department has to make."],
          ["c3", 80, "Four courses lost more than 10 points of attendance since week 3.", "The title states the finding, not the topic."],
        ],
      },
    ],
    endorsements: [
      { competencyId: "sql", name: "Samuel Ade", role: "Mentor", organisation: "Kestrel Analytics", statement: "I mentored Priya through a retention analysis on our anonymised data. She caught the incomplete-window problem before I mentioned it.", date: "2026-10-20", project: 0, domain: "kestrel-analytics.example" },
    ],
  },
  {
    id: "daniel-reyes",
    name: "Daniel Reyes",
    department: "Business Administration",
    targetRoleId: "data-analyst",
    claims: [
      ["python", 85, "Expert in Python"],
      ["sql", 85, "Advanced SQL"],
      ["visualisation", 80, "Power BI and Tableau dashboards"],
      ["data-wrangling", 75, "Data cleaning at scale"],
      ["communication", 85, "Outstanding presenter"],
    ],
    runs: [
      { date: "2026-09-20", calibration: 41, over: 7, under: 0, skills: [["python", 85, 10], ["sql", 85, 35], ["data-wrangling", 75, 35], ["visualisation", 80, 60], ["statistics", null, 10], ["communication", 85, 60], ["problem-solving", null, 35]] },
    ],
    projects: [
      {
        projectId: "sales-cleaning",
        date: "2026-10-18",
        submission: `import pandas as pd
df = pd.read_csv('sales.csv')
df = df.drop_duplicates()
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df = df.dropna()
df.to_csv('clean.csv')

I cleaned the data so it is ready for analysis.`,
        summary: "The script runs, but it silently deletes rows and the note does not say what changed.",
        nextStep: "Count how many rows each step removes and say why each rule is right for the shop.",
        results: [
          ["c1", 45, "df = df.dropna()", "Runs, but dropna removes every row with any missing value, not just bad dates.", "failed"],
          ["c2", 30, "errors='coerce'", "Unreadable dates become missing and are then dropped; negative quantities are not handled.", "failed"],
          ["c3", 20, "I cleaned the data so it is ready for analysis.", "Does not tell the shop what was removed or why."],
        ],
        defence: { date: "2026-10-19", feedback: "Daniel could not say why rows were disappearing after dropna, or what happens to dates that fail to parse." },
      },
    ],
  },
  {
    id: "zainab-hassan",
    name: "Zainab Hassan",
    department: "Economics",
    targetRoleId: "data-analyst",
    claims: [
      ["visualisation", 70, "Data storytelling and dashboards"],
      ["statistics", 75, "Econometrics and regression"],
      ["communication", 70, "Policy brief writing"],
      ["sql", 60, "Working knowledge of SQL"],
    ],
    runs: [
      { date: "2026-07-14", calibration: 76, over: 1, under: 1, skills: [["sql", 60, 35], ["python", null, 10], ["data-wrangling", null, 35], ["visualisation", 70, 90], ["statistics", 75, 60], ["communication", 70, 90], ["problem-solving", null, 60]] },
    ],
    projects: [
      {
        projectId: "dashboard-brief",
        date: "2026-08-20",
        submission: `The head of department needs to decide which courses to follow up with.
I would show one heatmap: courses down the side, weeks across the top, colour from light to dark for attendance rate, sorted by the biggest fall.
A heatmap shows every course on one page without 40 separate lines.
Under it, a table of the five courses with the largest drop and the lecturer to contact.
Title: Attendance is falling fastest in first-year Statistics and Accounting.`,
        summary: "A compact, well-argued report that leads to an action.",
        nextStep: "Say how you would show a course with very few students so its swings are not over-read.",
        results: [
          ["c1", 85, "sorted by the biggest fall", "A sequential heatmap sorted by change fits 40 courses on one page honestly."],
          ["c2", 80, "The head of department needs to decide which courses to follow up with.", "Scoped to the decision, ending with who to contact."],
          ["c3", 85, "Attendance is falling fastest in first-year Statistics and Accounting.", "The title is the finding."],
        ],
      },
    ],
    endorsements: [
      { competencyId: "visualisation", name: "Dr Helen Okafor", role: "Lecturer", organisation: "Sample University, Department of Economics", statement: "Zainab built the attendance heatmap for our department review herself, and the committee used it to decide which courses to visit.", date: "2026-08-28", project: 0, domain: "sample-university.example" },
    ],
  },
  {
    id: "kwame-owusu",
    name: "Kwame Owusu",
    department: "Engineering",
    targetRoleId: "data-analyst",
    claims: [
      ["python", 50, "Some Python from engineering labs"],
      ["statistics", 55, "Basic statistics"],
      ["sql", 30, "Beginner SQL"],
    ],
    runs: [
      { date: "2026-09-22", calibration: 68, over: 0, under: 5, skills: [["python", 50, 90], ["sql", 30, 35], ["data-wrangling", null, 60], ["visualisation", null, 35], ["statistics", 55, 90], ["communication", null, 60], ["problem-solving", null, 90]] },
    ],
    projects: [
      {
        projectId: "sales-cleaning",
        date: "2026-10-20",
        submission: `import pandas as pd

def load(path):
    return pd.read_csv(path, dtype={"order_id": str})

def clean(df):
    before = len(df)
    df = df.drop_duplicates(subset=["order_id", "line"])
    df["date"] = pd.to_datetime(df["date"], format="mixed", dayfirst=True, errors="coerce")
    bad_dates = df["date"].isna().sum()
    df["is_return"] = df["qty"] < 0
    print(f"{before - len(df)} duplicate rows removed, {bad_dates} dates could not be read")
    return df

Note: Some orders appeared twice, so I kept one copy of each order line. Dates came in two formats; I read both, and listed the 12 I could not read rather than guessing. Negative quantities are returns, so I kept them and marked them, because deleting them would overstate sales.`,
        summary: "Explicit, explained rules for every problem in the file, including returns.",
        nextStep: "Write the rows with unreadable dates to a separate file so the shop can fix them.",
        results: [
          ["c1", 85, `df = df.drop_duplicates(subset=["order_id", "line"])`, "Small functions, deduplication on the real key, and a printed audit of what changed.", "defended"],
          ["c2", 85, `df["is_return"] = df["qty"] < 0`, "Treats negative quantities as returns instead of deleting them.", "defended"],
          ["c3", 80, "deleting them would overstate sales", "Explains each rule in terms the shop cares about.", "defended"],
        ],
        defence: { date: "2026-10-21", feedback: "Kwame explained why order_id is read as text and why returns are kept, without notes." },
      },
    ],
    endorsements: [
      { competencyId: "python", name: "Prof. Ruth Tembo", role: "Lecturer", organisation: "Sample University, Department of Engineering", statement: "Kwame automated the cleaning of our lab sensor logs in Python. He undersells himself; the code is better than most I see from data students.", date: "2026-10-26", domain: "sample-university.example" },
    ],
    sprint: { competencyId: "sql", projectId: "sql-retention", criterionId: "c1", target: 70, startedAt: at("2026-11-06"), dueAt: at("2026-11-20") },
  },
  {
    id: "chidi-nwosu",
    name: "Chidi Nwosu",
    department: "Computer Science",
    targetRoleId: "software-developer",
    claims: [
      ["javascript", 70, "Node.js and Express"],
      ["git-testing", 60, "Git and unit testing"],
      ["python", 60, "Python scripting"],
    ],
    runs: [
      { date: "2026-10-01", calibration: 72, over: 1, under: 1, skills: [["javascript", 70, 60], ["python", 60, 60], ["git-testing", 60, 35], ["sql", null, 60], ["communication", null, 35], ["problem-solving", null, 60]] },
    ],
    projects: [
      {
        projectId: "tasks-api",
        date: "2026-10-30",
        submission: `app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "title missing" });
  const task = await db.insert({ title });
  res.status(201).json(task);
});

app.get("/tasks", async (req, res) => {
  res.json(await db.all());
});

test("creates a task", async () => {
  const res = await request(app).post("/tasks").send({ title: "Read chapter 4" });
  expect(res.status).toBe(201);
});

Commits: initial commit, added routes, fixed stuff`,
        summary: "The happy path works, but failures and odd input are not handled and there is only one test.",
        nextStep: "Add tests for a blank title and a failing database, then fix the handler until they pass.",
        results: [
          ["c1", 60, `if (!title) return res.status(400).json({ error: "title missing" });`, "Rejects a missing title, but a failed insert is not caught."],
          ["c2", 35, "Commits: initial commit, added routes, fixed stuff", "One success test only, and commit messages do not say what changed."],
          ["c3", 45, "const { title } = req.body;", "Whitespace titles and non-string input are not considered."],
        ],
      },
    ],
    sprint: { competencyId: "git-testing", projectId: "tasks-api", criterionId: "c2", target: 70, startedAt: at("2026-11-01"), dueAt: at("2026-11-15") },
  },
  {
    id: "grace-tembo",
    name: "Grace Tembo",
    department: "Mass Communication",
    targetRoleId: "data-analyst",
    claims: [
      ["communication", 85, "Award-winning student journalist"],
      ["visualisation", 50, "Infographics for the campus paper"],
    ],
    runs: [
      { date: "2026-11-04", calibration: 80, over: 1, under: 1, skills: [["python", null, 10], ["sql", null, 10], ["data-wrangling", null, 35], ["visualisation", 50, 60], ["statistics", null, 35], ["communication", 85, 90], ["problem-solving", null, 60]] },
    ],
    interviews: [
      { date: "2026-11-09", skills: [
        ["communication", 85, "I would start with what the numbers mean for the reader, then show one chart, then the caveat", "Structures an explanation around the audience."],
        ["problem-solving", 60, "I would ask who is going to act on this before choosing what to measure", "Starts from the decision, but did not get to a concrete method."],
      ] },
    ],
  },
  {
    id: "yusuf-lawal",
    name: "Yusuf Lawal",
    department: "Engineering",
    targetRoleId: "software-developer",
    claims: [
      ["python", 75, "Python for simulations"],
      ["javascript", 65, "Learning JavaScript"],
      ["problem-solving", 80, "Strong engineering problem solver"],
      ["git-testing", 50, "Uses Git"],
    ],
    runs: [
      { date: "2026-09-12", calibration: 77, over: 2, under: 1, skills: [["javascript", 65, 35], ["python", 75, 90], ["git-testing", 50, 60], ["sql", null, 35], ["communication", null, 60], ["problem-solving", 80, 90]] },
      { date: "2026-10-27", calibration: 83, over: 1, under: 0, skills: [["javascript", 65, 60], ["sql", null, 60]] },
    ],
    projects: [
      {
        projectId: "tasks-api",
        date: "2026-10-21",
        submission: `const tasks = [];

export async function createTask(input) {
  if (typeof input?.title !== "string" || input.title.trim() === "") {
    throw new ValidationError("title must be a non-empty string");
  }
  const task = { id: tasks.length + 1, title: input.title.trim(), createdAt: new Date().toISOString() };
  tasks.push(task);
  return task;
}

export const listTasks = async () => [...tasks];

// test: createTask rejects { title: 42 } with ValidationError
// test: listTasks returns a copy, so callers cannot change stored tasks

Commits: "validate title type", "return a copy from listTasks", "add createdAt"`,
        summary: "Thoughtful validation and a defensive copy, but the tests are described rather than written.",
        nextStep: "Turn the two described tests into runnable tests.",
        results: [
          ["c1", 70, `typeof input?.title !== "string"`, "Validates type and blank titles; there is no storage that can fail yet.", "defended"],
          ["c2", 55, "test: listTasks returns a copy, so callers cannot change stored tasks", "Good test ideas and clear commits, but the tests are not code."],
          ["c3", 80, "export const listTasks = async () => [...tasks];", "Returning a copy shows deliberate thinking about how callers misuse data.", "defended"],
        ],
        defence: { date: "2026-10-22", feedback: "Yusuf explained the defensive copy with an example of a caller changing the list." },
      },
    ],
    interviews: [
      { date: "2026-11-02", skills: [
        ["problem-solving", 80, "I split the failing run into the data step and the model step and timed each one", "Isolates the fault before fixing it."],
        ["communication", 65, "the short answer is the cache was stale", "Gives the conclusion first, but skipped the evidence."],
      ] },
    ],
    endorsements: [
      { competencyId: "problem-solving", name: "Ifeoma Clarke", role: "Mentor", organisation: "Cobalt Payments", statement: "In our mentoring sessions Yusuf always breaks a bug down before touching code. He found a timezone issue in a practice task that I had missed.", date: "2026-11-07" },
    ],
  },
  {
    id: "lena-clarke",
    name: "Lena Clarke",
    department: "Economics",
    targetRoleId: "data-analyst",
    claims: [
      ["statistics", 70, "Applied statistics"],
      ["communication", 70, "Clear report writing"],
      ["sql", 40, "Some SQL"],
    ],
    runs: [
      { date: "2026-09-05", calibration: 79, over: 1, under: 2, skills: [["python", null, 35], ["sql", 40, 10], ["data-wrangling", null, 35], ["visualisation", null, 60], ["statistics", 70, 60], ["communication", 70, 60], ["problem-solving", null, 60]] },
      { date: "2026-11-08", calibration: 86, over: 0, under: 1, skills: [["sql", 40, 90], ["python", null, 60]] },
    ],
    projects: [
      {
        projectId: "sql-retention",
        date: "2026-10-15",
        submission: `SELECT
  COUNT(DISTINCT CASE WHEN o2.order_date <= o1.order_date + INTERVAL '90 days' THEN o1.customer_id END) * 100.0
    / COUNT(DISTINCT o1.customer_id) AS pct_returned_90d
FROM (
  SELECT customer_id, MIN(order_date) AS order_date FROM orders GROUP BY customer_id
) o1
LEFT JOIN orders o2
  ON o2.customer_id = o1.customer_id AND o2.order_date > o1.order_date;

What I'd tell the business: about a quarter of first-time buyers come back within 90 days. The figure only covers customers who have ordered at least once, so people who signed up and never bought are not in it; that group needs its own number.`,
        summary: "Correct single query and a sharp point about who is missing from the rate.",
        nextStep: "Exclude customers whose first order is less than 90 days old, and end with one action.",
        results: [
          ["c1", 75, "LEFT JOIN orders o2", "Correct join and window, though recent customers are counted as non-returners.", "defended"],
          ["c2", 80, "people who signed up and never bought are not in it", "Names exactly who the rate leaves out.", "defended"],
          ["c3", 65, "about a quarter of first-time buyers come back within 90 days", "Clear figure, but no specific recommendation."],
        ],
        defence: { date: "2026-10-16", feedback: "Lena explained the DISTINCT counts and why the LEFT JOIN keeps one-time buyers." },
      },
    ],
    endorsements: [
      { competencyId: "sql", name: "Dr Helen Okafor", role: "Lecturer", organisation: "Sample University, Department of Economics", statement: "Lena came to every SQL clinic this term. In September she could not write a join; she now helps other students with theirs.", date: "2026-11-09", project: 0, domain: "sample-university.example" },
    ],
  },
  {
    id: "fatima-diallo",
    name: "Fatima Diallo",
    department: "Business Administration",
    targetRoleId: "data-analyst",
    claims: [
      ["communication", 70, "Client-facing presentations"],
      ["visualisation", 60, "Excel charts and reports"],
      ["sql", 50, "Introductory SQL"],
    ],
    runs: [
      { date: "2026-10-10", calibration: 81, over: 1, under: 1, skills: [["python", null, 35], ["sql", 50, 60], ["data-wrangling", null, 60], ["visualisation", 60, 60], ["statistics", null, 35], ["communication", 70, 90], ["problem-solving", null, 90]] },
    ],
    interviews: [
      { date: "2026-10-25", skills: [
        ["communication", 80, "Sales fell 8% because two stores closed; like-for-like sales actually grew 3%", "Leads with the answer and separates the cause from the trend."],
        ["problem-solving", 75, "before comparing months I checked whether the stores were the same in both", "Checks the comparison is fair before drawing a conclusion."],
      ] },
    ],
    endorsements: [
      { competencyId: "communication", name: "Marcus Hale", role: "Employer", organisation: "Harbour Retail Group", statement: "Fatima presented a sales review to our regional team during her placement. Managers asked for her slides afterwards.", date: "2026-11-01", domain: "harbourretail.example" },
    ],
  },
];

export const ROSTER: Student[] = SPECS.map(build);

/** The judge demo student first, then the rest of the sample roster. */
export function sampleStudents(): Student[] {
  return [seedStudent(), ...ROSTER];
}

/** A fresh copy of a sample student, optionally under a new id. */
export function sampleStudent(baseId: string, id: string = baseId): Student | null {
  if (baseId === DEMO_STUDENT_ID) return seedStudent(id);
  const spec = SPECS.find((s) => s.id === baseId);
  return spec ? build({ ...spec, id }) : null;
}
