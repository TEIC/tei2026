/**
 * Script for updating the special configuration for the 
 * Book of Abstracts. This ensures that all items are 
 * processed, but excludes all of the about pages etc
 */

import * as path from "jsr:@std/path";
import { expandGlob, copy, move, ensureDir } from "jsr:@std/fs";
import { stringify, parse } from "jsr:@std/yaml";

/* Input file to be transformed */
const INPUT_FILE = `_quarto-boa.yaml`;
const TMP_DIR = path.join(Deno.cwd(), "tmp");

/* Timestamp */
const TIMESTAMP = new Date().toLocaleString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

async function refreshDir(dir) {
  try {
    await Deno.lstat(dir);
    await Deno.remove(dir, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }
}

async function getConfig() {
  try {
    const config = parse(await Deno.readTextFile(INPUT_FILE));
    try {
      await Deno.remove(TMP_DIR, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }
    await Deno.mkdir(TMP_DIR);
    await move(INPUT_FILE, path.join(TMP_DIR, INPUT_FILE));
    return config;
  } catch (e) {
    console.error(`Error parsing config: ` + e);
  }
}

async function updateConfig() {
  const config = await getConfig();
  config.book.chapters = (
    await Promise.all(
      config.book.chapters.map(async (chapter) => {
        if (path.isGlob(chapter)) {
          const paths = (await Array.fromAsync(expandGlob(chapter))).filter(({ name}) => name !== "*.qmd");
          return paths.map(({ path: p }) => path.relative(Deno.cwd(), p));
        } else {
          return [chapter];
        }
      })
    )
  ).flat();
  return config;
}

async function writeConfig() {
  // // Convert the JavaScript object to a YAML string with 2-space indentation
  const config = await updateConfig();
  console.log(config);
  const yamlString = stringify(config, { indent: 2 });
  const outPath = path.join(Deno.cwd(), INPUT_FILE);
  // Write the YAML string to a file
  try {
    console.log(`Writing ${outPath}`);
    await Deno.writeTextFile(outPath, yamlString);
    await copy(outPath, path.join(TMP_DIR, `${INPUT_FILE}.processed` ));
  } catch (error) {
    console.error(`Error writing ${outPath}:`, error);
  }
}

writeConfig();

