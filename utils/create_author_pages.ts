import { parse } from "stdlib/yaml";

const dataDir = "authors";
const pagesDir = "authors";

let count = 0;

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

  Deno.writeTextFileSync(qmdPath, frontMatter + "\n" + body);
  count++;
}

console.log(`Generated ${count} author page(s).`);