import type { CompetencyId, Difficulty, Question } from "./types";

/** The question bank. Import it only from server code: it holds the answers, so it must never reach a client bundle. */
function q(id: string, competencyId: CompetencyId, level: Difficulty, prompt: string, options: string[], answerIndex: number): Question {
  return { id, competencyId, level, prompt, options, answerIndex };
}

/**
 * Two questions per difficulty for each skill a role needs, so a reassessment can use questions the student has not seen.
 * Options are shuffled when served, so the position of the correct answer tells the student nothing.
 */
export const QUESTIONS: Question[] = [
  q("py1", "python", 1, "What does [x * 2 for x in range(3)] evaluate to?", ["[0, 2, 4]", "[2, 4, 6]", "[0, 1, 2, 0, 1, 2]", "[1, 2, 3]"], 0),
  q("py3", "python", 1, "What does len({'a': 1, 'b': 2}) return?", ["1", "2", "4", "It raises an error"], 1),
  q("py4", "python", 2, "What does 'data,analysis,python'.split(',')[1] return?", ["'data'", "'analysis'", "'python'", "['analysis']"], 1),
  q("py5", "python", 2, "A dictionary d may not contain the key 'age'. Which expression returns 0 in that case instead of failing?", ["d['age'] or 0", "d.get('age', 0)", "d.age or 0", "d['age'] if d else 0"], 1),
  q("py2", "python", 3, "A function is defined as def add(item, items=[]): items.append(item); return items. What goes wrong when it is called twice with one argument?", ["It raises a TypeError", "The second call returns both items, because the default list is shared", "The second call returns an empty list", "Nothing goes wrong"], 1),
  q("py6", "python", 3, "What does sorted(['b', 'A', 'a', 'B']) return?", ["['A', 'a', 'B', 'b']", "['A', 'B', 'a', 'b']", "['a', 'A', 'b', 'B']", "['a', 'b', 'A', 'B']"], 1),

  q("js1", "javascript", 1, "What does [1, 2, 3].map(n => n + 1) return?", ["6", "[2, 3, 4]", "[1, 2, 3]", "undefined"], 1),
  q("js3", "javascript", 1, "Which keyword declares a variable that cannot be reassigned?", ["var", "let", "const", "static"], 2),
  q("js2", "javascript", 2, "What does an async function always return?", ["The raw value", "A callback", "A Promise", "undefined"], 2),
  q("js5", "javascript", 2, "What is the value of 0.1 + 0.2 === 0.3?", ["true", "false", "undefined", "It throws an error"], 1),
  q("js4", "javascript", 3, "What does [10, 1, 3].sort() return?", ["[1, 3, 10]", "[10, 1, 3]", "[1, 10, 3]", "[3, 1, 10]"], 2),
  q("js6", "javascript", 3, "What does this print? for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));", ["0 1 2", "3 3 3", "0 0 0", "Nothing"], 1),

  q("sql3", "sql", 1, "Which clause filters rows before they are grouped?", ["WHERE", "HAVING", "ORDER BY", "LIMIT"], 0),
  q("sql4", "sql", 1, "What does SELECT COUNT(*) FROM orders return?", ["The number of rows in orders", "The sum of every column", "The number of distinct customers", "The number of columns"], 0),
  q("sql1", "sql", 2, "Which join keeps every customer, including customers with no orders?", ["INNER JOIN orders", "customers LEFT JOIN orders", "customers RIGHT JOIN orders, keeping only order rows", "CROSS JOIN orders"], 1),
  q("sql2", "sql", 2, "You need only the departments whose total salary is above 100000. Where does that condition go?", ["WHERE SUM(salary) > 100000", "ORDER BY SUM(salary)", "HAVING SUM(salary) > 100000", "ON SUM(salary) > 100000"], 2),
  q("sql5", "sql", 3, "What does SELECT COUNT(email) FROM users count?", ["Every row", "Rows where email is not NULL", "Distinct emails only", "Rows where email is NULL"], 1),
  q("sql6", "sql", 3, "A query runs customers LEFT JOIN orders ON orders.customer_id = customers.id WHERE orders.total > 50. What happens to customers with no orders?", ["They are kept with empty totals", "They are dropped, because the WHERE condition is not true for empty values", "The query fails", "They appear twice"], 1),

  q("dw3", "data-wrangling", 1, "A date column contains both 2026-03-01 and 01/03/2026. What is the problem?", ["Nothing, both are dates", "Mixed formats can be read inconsistently, so they need one standard format", "The column is too long", "Dates cannot be stored in a table"], 1),
  q("dw4", "data-wrangling", 1, "Before you start cleaning a dataset, what should you keep?", ["Nothing, overwrite it as you go", "An untouched copy of the raw data", "Only the columns you plan to clean", "A screenshot of the first rows"], 1),
  q("dw1", "data-wrangling", 2, "A column of ages contains 34, 29, -1 and 999. What should you do first?", ["Average it anyway", "Delete the column", "Investigate the invalid values and decide on a documented rule", "Replace everything with zero"], 2),
  q("dw5", "data-wrangling", 2, "A price column is stored as text such as '£1,200'. What must happen before you can average it?", ["Nothing", "Remove the symbol and separator, then convert it to a number", "Sort it", "Round it"], 1),
  q("dw2", "data-wrangling", 3, "After merging two tables, the row count is much higher than either table. What is the most likely cause?", ["Duplicate keys in the join column", "Too many columns", "Missing values in an unrelated column", "The file was sorted"], 0),
  q("dw6", "data-wrangling", 3, "You fill every missing income with the overall average. What is the main risk?", ["It is slow to run", "It shrinks the spread and can bias results if values are missing for a reason", "It deletes rows", "It renames the column"], 1),

  q("vz1", "visualisation", 1, "Which chart best shows monthly revenue across two years?", ["Pie chart", "Line chart", "Scatter plot of random samples", "A 3D donut"], 1),
  q("vz3", "visualisation", 1, "What does every chart need so readers know what they are looking at?", ["A 3D effect", "A clear title and labelled axes", "As many colours as possible", "A background image"], 1),
  q("vz2", "visualisation", 2, "Why should a bar chart's value axis start at zero?", ["It looks tidier", "Bar length encodes the value, so a cut axis exaggerates differences", "Software requires it", "It makes labels shorter"], 1),
  q("vz4", "visualisation", 2, "You need to compare sales across 12 product categories. Which chart is clearest?", ["A pie chart with 12 slices", "A sorted horizontal bar chart", "A line chart", "A radar chart"], 1),
  q("vz5", "visualisation", 3, "Two measures with very different scales share one chart with two y-axes. What is the risk?", ["There is none", "The apparent relationship depends on how each axis was scaled, so readers can be misled", "It cannot be printed", "It needs a legend"], 1),
  q("vz6", "visualisation", 3, "How should a colour scale for one measure, from low to high, be built?", ["A rainbow of hues", "One hue from light to dark", "Random colours", "Red for low and green for high"], 1),

  q("st3", "statistics", 1, "What is the median of 3, 7, 9, 20 and 100?", ["9", "27.8", "20", "7"], 0),
  q("st4", "statistics", 1, "A survey of 10 people finds that 60% prefer option A. What is the main caution?", ["There is none", "The sample is very small, so the figure is uncertain", "60% is too high to be true", "Surveys cannot be used for decisions"], 1),
  q("st1", "statistics", 2, "Salaries in a team are heavily skewed by one executive. Which figure best describes a typical salary?", ["Mean", "Maximum", "Median", "Range"], 2),
  q("st2", "statistics", 2, "Ice cream sales and drowning incidents rise together. What is the best conclusion?", ["Ice cream causes drowning", "Drowning causes ice cream sales", "A third factor such as hot weather may explain both", "The data must be wrong"], 2),
  q("st5", "statistics", 3, "An A/B test shows version B converting 0.3 points higher, with p = 0.20. What is the best conclusion?", ["B is better", "The data do not yet show a reliable difference", "A is better", "20% of users prefer B"], 1),
  q("st6", "statistics", 3, "A condition affects 1 in 1,000 people. A test for it is 99% accurate. Someone tests positive. Roughly how likely are they to have it?", ["99%", "About 9%", "50%", "1%"], 1),

  q("gt1", "git-testing", 1, "You want to work on a feature without affecting main. What do you do?", ["Edit main directly and undo later", "Create a branch", "Delete the repository and clone it again", "Commit to a tag"], 1),
  q("gt3", "git-testing", 1, "What does git commit do?", ["Uploads your code to GitHub", "Records a snapshot of your staged changes in your local history", "Deletes old files", "Merges two branches"], 1),
  q("gt2", "git-testing", 2, "What is the main value of a regression test?", ["It makes code run faster", "It proves that a fixed bug does not return", "It replaces code review", "It formats the code"], 1),
  q("gt4", "git-testing", 2, "Which is the most useful commit message?", ["fix", "stuff", "Reject tasks with an empty title", "changes 2"], 2),
  q("gt5", "git-testing", 3, "A test passes whether or not the function under test is correct. What is wrong with it?", ["Nothing, passing is good", "It has no meaningful assertion, so it can never fail", "It runs too fast", "It is in the wrong folder"], 1),
  q("gt6", "git-testing", 3, "You pushed a commit containing a password to a shared repository. What comes first?", ["Rewrite the history quietly", "Revoke and replace the password, then remove it from the code", "Delete the repository", "Add the file to .gitignore"], 1),

  q("cm2", "communication", 1, "You realise you will miss a deadline by two days. What is the best action?", ["Say nothing and work faster", "Tell the team now, with the reason and a new date", "Hand in incomplete work without comment", "Wait for someone to ask"], 1),
  q("cm3", "communication", 1, "A teammate's request is unclear. What do you do?", ["Guess what they meant", "Ask a specific clarifying question", "Ignore it until they follow up", "Complain to your manager"], 1),
  q("cm1", "communication", 2, "A manager with no technical background asks for your analysis. What do you lead with?", ["The finding and what it means for their decision", "The code you wrote", "The full list of data cleaning steps", "The names of the statistical tests"], 0),
  q("cm4", "communication", 2, "Your report has one key finding and ten supporting tables. Where does the finding go?", ["At the end, after the evidence", "In the first sentence or two", "In an appendix", "Only in the slides"], 1),
  q("cm5", "communication", 3, "Your analysis contradicts what a senior stakeholder expects. What is the best approach?", ["Soften the numbers", "Present the finding with its evidence and limits, and offer to walk through it", "Leave it out of the report", "Send it without comment"], 1),
  q("cm6", "communication", 3, "A chart in your presentation is accurate, but the audience keeps misreading it. What does that tell you?", ["The audience is wrong", "The communication failed, so change the chart or how you explain it", "You need more data", "Nothing"], 1),

  q("ps2", "problem-solving", 1, "A task feels too large to estimate. What is the most useful next step?", ["Pick a number at random", "Break it into smaller parts and estimate those", "Start at the hardest line of code", "Decline the task"], 1),
  q("ps3", "problem-solving", 1, "A bug only happens sometimes. What helps most first?", ["Rewrite the code", "Find steps that reproduce it reliably", "Ignore it", "Add more features"], 1),
  q("ps1", "problem-solving", 2, "A report that worked yesterday now shows zero sales. What do you check first?", ["Rewrite the report", "Whether the input data arrived and what changed since yesterday", "Change the chart colours", "Ask for a new computer"], 1),
  q("ps4", "problem-solving", 2, "Two fixes would solve a problem: one quick and fragile, one slower and robust. The deadline is tomorrow. What is a sound choice?", ["Ship the quick fix and never revisit it", "Ship the quick fix, state the risk, and schedule the robust one", "Miss the deadline without telling anyone", "Choose at random"], 1),
  q("ps5", "problem-solving", 3, "Your change makes an error disappear, but you cannot explain why. What next?", ["Ship it", "Find the cause before trusting the fix", "Delete the failing tests", "Wrap everything in try and catch"], 1),
  q("ps6", "problem-solving", 3, "A query has become slow. What do you do before changing it?", ["Rewrite it entirely", "Measure where the time goes, then change one thing at a time", "Buy a bigger server", "Add indexes to every column"], 1),

  q("dl1", "digital-literacy", 1, "An email asks you to confirm your university password through a link. What should you do?", ["Enter it quickly", "Forward it to classmates", "Report it and go to the official site directly", "Reply with your password"], 2),
  q("dl2", "digital-literacy", 2, "You are sharing a dataset containing names and phone numbers for a class project. What should you do?", ["Post it publicly", "Remove or anonymise the personal details first", "Rename the file", "Convert it to a PDF"], 1),
];

export function question(id: string): Question | undefined {
  return QUESTIONS.find((item) => item.id === id);
}
