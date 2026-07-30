import { parse } from "stdlib/yaml";

const dataDir = "authors";
const pagesDir = "authors";

let count = 0;

if (!Deno.env.get("QUARTO_PROJECT_RENDER_ALL")) {
  Deno.exit();
}

for (const entry of Deno.readDirSync(dataDir)) {
  if (!entry.isFile || !entry.name.endsWith(".yaml")) continue;

  const yamlPath = `${dataDir}/${entry.name}`;
  const { author } = parse(Deno.readTextFileSync(yamlPath));
  console.log(`Processing ${entry.name}`);  
  if (!author) {
    console.warn(`Skipping ${entry.name}: no "author" entry found`);

    continue;
  }
  const stem = entry.name.replace(/\.yaml$/, "");
  const qmdPath = `${pagesDir}/${stem}.qmd`;

  // ---- YAML front matter ----
  // JSON.stringify safely quotes/escapes the title for YAML.
  const frontMatter = [
    "---",
    `title: ${JSON.stringify(author.name)}`,

    "metadata-files:",
    `  - ${entry.name}`,
    "---",
    "",
  ].join("\n");

  // ---- Markdown body ----

  const bodyLines = [];

  if (author.metadata.bio) {
    bodyLines.push("## About", "", author.metadata.bio.trim(), "");
  }
  const body = bodyLines.join("\n");
  const newContent = frontMatter + "\n" + bodyLines.join("\n");

  let existing = null;
  try {
    existing = Deno.readTextFileSync(qmdPath);
  } catch (_) {
    // file doesn't exist yet — that's fine
  }

  if (existing === newContent) {
    console.log('Unchanged content; skipping')
    continue;
  }

  Deno.writeTextFileSync(qmdPath, newContent);
  count++;
}

console.log(`Generated ${count} author page(s).`);