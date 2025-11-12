import { stringify } from "jsr:@std/yaml";
// Define the data to be written to the YAML file
const config = {
  project: {
    type: "book"
  },
  book: {
   title: "TEI2026",
   chapters: ['index.qmd']
  },
  format: {
    "pdf":  {
        "documentclass": "scrbook",
        "classoption": ["twocolumn"]
    }
  }
};
for await (const dirEntry of Deno.readDir("./contributions")) {
  console.log(dirEntry.name);
  console.log(dirEntry);
  config.book.chapters.push(`./contributions/${dirEntry.name}`);
}


// Convert the JavaScript object to a YAML string with 2-space indentation
const yamlString = stringify(config, { indent: 2 });

// Write the YAML string to a file
try {
  await Deno.writeTextFile("_quarto-boa-test.yaml", yamlString);
  console.log("../_quarto-boa-test.yaml.");
} catch (error) {
  console.error("Error writing settings.yaml:", error);
}