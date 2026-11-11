import type { Competency, CompetencyId, Job, Project, Question, Role } from "./types";

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

export const QUESTIONS: Question[] = [
  { id: "py1", competencyId: "python", prompt: "What does [x * 2 for x in range(3)] evaluate to?", options: ["[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2, 0, 1, 2]", "[1, 2, 3]"], answerIndex: 0 },
  { id: "py2", competencyId: "python", prompt: "A function is defined as def add(item, items=[]): items.append(item); return items. What goes wrong when it is called twice with one argument?", options: ["It raises a TypeError", "The second call returns both items, because the default list is shared", "The second call returns an empty list", "Nothing goes wrong"], answerIndex: 1 },
  { id: "js1", competencyId: "javascript", prompt: "What does [1, 2, 3].map(n => n + 1) return?", options: ["6", "[2, 3, 4]", "[1, 2, 3]", "undefined"], answerIndex: 1 },
  { id: "js2", competencyId: "javascript", prompt: "What does an async function always return?", options: ["The raw value", "A callback", "A Promise", "undefined"], answerIndex: 2 },
  { id: "sql1", competencyId: "sql", prompt: "Which join keeps every customer, including customers with no orders?", options: ["INNER JOIN orders", "customers LEFT JOIN orders", "customers RIGHT JOIN orders, keeping only order rows", "CROSS JOIN orders"], answerIndex: 1 },
  { id: "sql2", competencyId: "sql", prompt: "You need only the departments whose total salary is above 100000. Where does that condition go?", options: ["WHERE SUM(salary) > 100000", "ORDER BY SUM(salary)", "HAVING SUM(salary) > 100000", "ON SUM(salary) > 100000"], answerIndex: 2 },
  { id: "dw1", competencyId: "data-wrangling", prompt: "A column of ages contains 34, 29, -1 and 999. What should you do first?", options: ["Average it anyway", "Delete the column", "Investigate the invalid values and decide on a documented rule", "Replace everything with zero"], answerIndex: 2 },
  { id: "dw2", competencyId: "data-wrangling", prompt: "After merging two tables, the row count is much higher than either table. What is the most likely cause?", options: ["Duplicate keys in the join column", "Too many columns", "Missing values in an unrelated column", "The file was sorted"], answerIndex: 0 },
  { id: "vz1", competencyId: "visualisation", prompt: "Which chart best shows monthly revenue across two years?", options: ["Pie chart", "Line chart", "Scatter plot of random samples", "A 3D donut"], answerIndex: 1 },
  { id: "vz2", competencyId: "visualisation", prompt: "Why should a bar chart's value axis start at zero?", options: ["It looks tidier", "Bar length encodes the value, so a cut axis exaggerates differences", "Software requires it", "It makes labels shorter"], answerIndex: 1 },
  { id: "st1", competencyId: "statistics", prompt: "Salaries in a team are heavily skewed by one executive. Which figure best describes a typical salary?", options: ["Mean", "Maximum", "Median", "Range"], answerIndex: 2 },
  { id: "st2", competencyId: "statistics", prompt: "Ice cream sales and drowning incidents rise together. What is the best conclusion?", options: ["Ice cream causes drowning", "Drowning causes ice cream sales", "A third factor such as hot weather may explain both", "The data must be wrong"], answerIndex: 2 },
  { id: "gt1", competencyId: "git-testing", prompt: "You want to work on a feature without affecting main. What do you do?", options: ["Edit main directly and undo later", "Create a branch", "Delete the repository and clone again", "Commit to a tag"], answerIndex: 1 },
  { id: "gt2", competencyId: "git-testing", prompt: "What is the main value of a regression test?", options: ["It makes code run faster", "It proves that a fixed bug does not return", "It replaces code review", "It formats the code"], answerIndex: 1 },
  { id: "cm1", competencyId: "communication", prompt: "A manager with no technical background asks for your analysis. What do you lead with?", options: ["The finding and what it means for their decision", "The code you wrote", "The full list of data cleaning steps", "The statistical test names"], answerIndex: 0 },
  { id: "cm2", competencyId: "communication", prompt: "You realise you will miss a deadline by two days. What is the best action?", options: ["Say nothing and work faster", "Tell the team now, with the reason and a new date", "Hand in incomplete work without comment", "Wait for someone to ask"], answerIndex: 1 },
  { id: "ps1", competencyId: "problem-solving", prompt: "A report that worked yesterday now shows zero sales. What do you check first?", options: ["Rewrite the report", "Whether the input data arrived and what changed since yesterday", "Change the chart colours", "Ask for a new computer"], answerIndex: 1 },
  { id: "ps2", competencyId: "problem-solving", prompt: "A task feels too large to estimate. What is the most useful next step?", options: ["Pick a number at random", "Break it into smaller parts and estimate those", "Start at the hardest line of code", "Decline the task"], answerIndex: 1 },
  { id: "dl1", competencyId: "digital-literacy", prompt: "An email asks you to confirm your university password through a link. What should you do?", options: ["Enter it quickly", "Forward it to classmates", "Report it and go to the official site directly", "Reply with your password"], answerIndex: 2 },
  { id: "dl2", competencyId: "digital-literacy", prompt: "You are sharing a dataset containing names and phone numbers for a class project. What should you do?", options: ["Post it publicly", "Remove or anonymise the personal details first", "Rename the file", "Convert it to a PDF"], answerIndex: 1 },
];

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
