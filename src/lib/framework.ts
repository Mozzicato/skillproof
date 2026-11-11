import type { AssessmentTask, Competency, CompetencyId, Job, Project, Role } from "./types";

export const COMPETENCIES: Competency[] = [
  { id: "python", name: "Python", category: "Technical", description: "Writing correct, readable Python to solve practical problems." },
  { id: "javascript", name: "JavaScript", category: "Technical", description: "Building working features and handling asynchronous code." },
  { id: "sql", name: "SQL", category: "Technical", description: "Querying relational data with joins, filters and aggregation." },
  { id: "data-wrangling", name: "Data wrangling", category: "Technical", description: "Cleaning, reshaping and validating messy datasets." },
  { id: "visualisation", name: "Data visualisation", category: "Technical", description: "Choosing and building charts that answer a question." },
  { id: "statistics", name: "Statistics", category: "Technical", description: "Reasoning correctly about samples, averages and uncertainty." },
  { id: "git-testing", name: "Version control and testing", category: "Technical", description: "Working with Git and proving code works with tests." },
  { id: "communication", name: "Communication", category: "Professional", description: "Explaining work clearly to the people who need it." },
  { id: "problem-solving", name: "Problem solving", category: "Professional", description: "Breaking a problem down and justifying an approach." },
  { id: "digital-literacy", name: "Digital literacy", category: "Professional", description: "Using digital tools and handling data safely and responsibly." },
];

export function competency(id: CompetencyId): Competency {
  return COMPETENCIES.find((c) => c.id === id)!;
}

export const ROLES: Role[] = [
  {
    id: "data-analyst",
    title: "Junior Data Analyst",
    requirements: [
      { competencyId: "sql", level: 70 },
      { competencyId: "python", level: 60 },
      { competencyId: "data-wrangling", level: 70 },
      { competencyId: "visualisation", level: 60 },
      { competencyId: "statistics", level: 60 },
      { competencyId: "communication", level: 65 },
      { competencyId: "problem-solving", level: 60 },
    ],
  },
  {
    id: "software-developer",
    title: "Junior Software Developer",
    requirements: [
      { competencyId: "javascript", level: 70 },
      { competencyId: "python", level: 50 },
      { competencyId: "git-testing", level: 70 },
      { competencyId: "sql", level: 50 },
      { competencyId: "communication", level: 60 },
      { competencyId: "problem-solving", level: 70 },
    ],
  },
];

export function role(id: string): Role {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

/** One short applied task per role, graded by AI, so the assessment is more than recognition. */
export const ASSESSMENT_TASKS: AssessmentTask[] = [
  {
    roleId: "data-analyst",
    competencyId: "sql",
    prompt:
      "Tables: customers(id, name) and orders(id, customer_id, order_date, total). Write a query that lists every customer with their total spend in 2026, highest first, including customers who spent nothing. Then state one assumption you made.",
    criterion: "The query uses a correct join, date filter and grouping, keeps customers with no 2026 orders, and states a reasonable assumption.",
  },
  {
    roleId: "software-developer",
    competencyId: "javascript",
    prompt:
      "Write a JavaScript function overdue(tasks, today) that returns the titles of tasks that are not done and whose dueDate is before today. Each task looks like { title, done, dueDate } with ISO date strings. Add one test case.",
    criterion: "The function is correct, compares dates properly, ignores finished tasks, and the test checks a meaningful case.",
  },
];

export function assessmentTask(roleId: string): AssessmentTask {
  return ASSESSMENT_TASKS.find((t) => t.roleId === roleId) ?? ASSESSMENT_TASKS[0];
}

export const PROJECTS: Project[] = [
  {
    id: "sales-cleaning",
    title: "Clean a messy sales export",
    brief: "A shop's sales export has duplicate rows, mixed date formats and negative quantities. Write a Python script that cleans it, then explain the rules you applied.",
    deliverable: "Paste your Python code and a short note explaining each cleaning rule.",
    rubric: [
      { id: "c1", competencyId: "python", criterion: "Code is correct, readable and organised into sensible steps" },
      { id: "c2", competencyId: "data-wrangling", criterion: "Handles duplicates, date formats and invalid quantities with explicit rules" },
      { id: "c3", competencyId: "communication", criterion: "The note lets a non-programmer understand what changed and why" },
    ],
  },
  {
    id: "sql-retention",
    title: "Find out why customers stop buying",
    brief: "Given customers(id, signup_date) and orders(id, customer_id, order_date, total), write SQL that measures how many customers return within 90 days, then state what you would tell the business.",
    deliverable: "Paste your SQL queries and a recommendation of up to 150 words.",
    rubric: [
      { id: "c1", competencyId: "sql", criterion: "Queries use correct joins, grouping and date logic" },
      { id: "c2", competencyId: "statistics", criterion: "Interprets the rate correctly and notes limits of the data" },
      { id: "c3", competencyId: "communication", criterion: "The recommendation is specific and follows from the numbers" },
    ],
  },
  {
    id: "dashboard-brief",
    title: "Design a one-page student attendance report",
    brief: "A head of department wants to spot courses with falling attendance. Describe or build a one-page report: which charts you chose, why, and what decision each supports.",
    deliverable: "Paste your chart code or a written specification, with reasons for each choice.",
    rubric: [
      { id: "c1", competencyId: "visualisation", criterion: "Chart choices match the question and avoid misleading encodings" },
      { id: "c2", competencyId: "problem-solving", criterion: "Starts from the decision needed and scopes the report to it" },
      { id: "c3", competencyId: "communication", criterion: "Titles and notes state the takeaway plainly" },
    ],
  },
  {
    id: "tasks-api",
    title: "Build a small tasks API with tests",
    brief: "Build a JavaScript endpoint that creates and lists tasks, rejects invalid input, and has automated tests. Describe your commit history.",
    deliverable: "Paste your handler, your tests and a list of your commit messages.",
    rubric: [
      { id: "c1", competencyId: "javascript", criterion: "Handler is correct, handles invalid input and async errors" },
      { id: "c2", competencyId: "git-testing", criterion: "Tests cover success and failure, and commits are small and descriptive" },
      { id: "c3", competencyId: "problem-solving", criterion: "Edge cases are identified and handled deliberately" },
    ],
  },
];

export function project(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

/** Fictional employers and vacancies used for the demo. */
export const JOBS: Job[] = [
  { id: "j1", company: "Kestrel Analytics", title: "Data Analyst Intern", type: "Internship", location: "Remote", requirements: [{ competencyId: "sql", level: 60 }, { competencyId: "python", level: 50 }, { competencyId: "communication", level: 55 }] },
  { id: "j2", company: "Harbour Retail Group", title: "Junior Insights Analyst", type: "Entry-level", location: "Hybrid", requirements: [{ competencyId: "sql", level: 70 }, { competencyId: "visualisation", level: 60 }, { competencyId: "statistics", level: 55 }, { competencyId: "communication", level: 65 }] },
  { id: "j3", company: "Brightline Health", title: "Data Quality Associate", type: "Entry-level", location: "On-site", requirements: [{ competencyId: "data-wrangling", level: 65 }, { competencyId: "digital-literacy", level: 70 }, { competencyId: "problem-solving", level: 55 }] },
  { id: "j4", company: "Fieldnote Labs", title: "Graduate Developer", type: "Entry-level", location: "Hybrid", requirements: [{ competencyId: "javascript", level: 70 }, { competencyId: "git-testing", level: 65 }, { competencyId: "problem-solving", level: 65 }] },
  { id: "j5", company: "Cobalt Payments", title: "Software Engineering Intern", type: "Internship", location: "Remote", requirements: [{ competencyId: "javascript", level: 55 }, { competencyId: "git-testing", level: 50 }, { competencyId: "communication", level: 50 }] },
  { id: "j6", company: "Ridgeway Logistics", title: "Operations Reporting Intern", type: "Internship", location: "On-site", requirements: [{ competencyId: "sql", level: 50 }, { competencyId: "visualisation", level: 50 }, { competencyId: "digital-literacy", level: 60 }] },
];
