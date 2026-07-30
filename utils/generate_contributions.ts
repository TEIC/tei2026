/**
 * Script to generate all of the contribution files from the source
 * Conftool JSON
 * 
 */


import * as path from "jsr:@std/path";
import { exists } from "jsr:@std/fs/exists";
import { expandGlob, copy, move, ensureDir } from "jsr:@std/fs";
import { stringify, parse } from "jsr:@std/yaml";
import { escape, unescape } from "jsr:@std/html/entities";
import { htmlToMd } from "jsr:@codybrom/html2md";



const LOCAL_DIR = ".local";
const FILES_DIR = `${LOCAL_DIR}/Files-TEI2026-2026-07-29_17/out`;
const AUTHORS_DIR = "authors";
const OUTPUT_DIR = "contributions";

// First step, parse all of the JSON into individual files

// 1. Read the JSON file
const jsonString = await Deno.readTextFile(`${LOCAL_DIR}/TEI2026_papers_2026-07-29_17.json`);
const data = JSON.parse(jsonString);

const getNameKey = (name) => {
    const [last, _first] = name.split(/\s*,\s*/gi)
    const norm = last.normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/\p{P}/gu, '')
                        .replace(/ø/g, 'o')
                        .toLowerCase()
    const key = norm.split(' ').join();
    return key;
}


const splitAuthors = (text) => {
    const regex = /([^;]+?)(?:\s*\(([\d,\s]+)\))?(?:;|$)/g;
    const result = Array.from(text.matchAll(regex))
        .map(match => {
    const textPart = match[1].trim();
    
    if (!textPart) return null;

    const numbersPart = match[2] 
      ? match[2].split(',').map(num => Number(num.trim()))
      : [1];

    return {
      name: textPart,
      id: getNameKey(textPart),
      affiliation: numbersPart
    };
  })
  .filter(item => item !== null); // Clean up any empty trailing matches
  return result;
}

for await (const paper of data){
    // First we need to unescape all of the fields
    Object.keys(paper).forEach(key => {
        if (typeof paper[key] === "string"){
            paper[key] = unescape(paper[key]);
        }

    });

    // Now we can grab the stuff we want
    const { paperID, authors, keywords, organisations: orgs,  original_filename_final_a: filename} = paper;
    const allAuthors = splitAuthors(authors);
    const allOrgs = orgs.split(/;\n/gi).map(org => {
        return org.replace(/^\s*\d+:\s*/gi,'');
    })



    allAuthors.forEach(author => {
        author.affiliation = author.affiliation.map(org => {
            return {name: allOrgs[org - 1]}
        })
    })


      const contribution = {
        title: paper.title,
        authors: allAuthors,
        abstract: {
            original: htmlToMd(paper.abstract),
            final: ""
        },
        keywords: []
    }

    if (keywords !== ""){
        const commaSep = keywords.split(/\s*,\s*/gi);
        const semicolonSep = keywords.split(/\s*;\s*/gi);
        if (semicolonSep.length > commaSep.length){
            contribution.keywords = semicolonSep;
        }
        if (commaSep.length > semicolonSep.length){
            contribution.keywords =  commaSep;
        }
        if (commaSep.length == semicolonSep.length){
            contribution.keywords =  commaSep
        }
    }

    
    const hasFile = filename !== "";
    if (hasFile){
        try {
            const fileContents = await Deno.readTextFile(`${FILES_DIR}/${filename}.md`);
            contribution.abstract.final = fileContents;
        } catch (_) {
            // This is fine
        }
    }

    const {abstract, ...frontmatter} = contribution;
    const body = abstract.final !== "" ? abstract.final : abstract.original;
    const header = "---\n" + stringify(frontmatter) + "\n---\n";
    const outName = `${OUTPUT_DIR}/contribution_${paperID}.qmd`;
    const output = header + "\n" + body;

    await Deno.writeTextFile(outName, output);
    console.log(`Wrote ${outName}`);

}



// // 2. Convert to YAML and save
// const yamlOutput = stringify(data);
// await Deno.writeTextFile("data.yaml", yamlOutput);

// // 3. Convert to Markdown and save
// // (Creating a table or list representation of the data)
// const mdOutput = `# Parsed Data\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
// await Deno.writeTextFile("data.md", mdOutput);

// console.log("Files created successfully!");