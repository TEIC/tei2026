import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";


const SCRIPTS = {
"quarto-nav.js": false,
"clipboard.min.js": true,
"autocomplete.umd.js": true,
"fuse.min.js": true,
"quarto-search.js": true,
"quarto.js": false,
"tabsets.js": true,
"axe-check.js": false,
"popper.min.js": true,
"bootstrap.min.js": true,
"htmlwidgets.js": true,
"jquery-3.6.0.min.js": true,
"leaflet.js": true,
"proj4.min.js": true,
"proj4leaflet.js": true,
}

// ------------------------------
// DOM-based transform
// ------------------------------
function transform(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return html; // fallback if parsing fails

//  1. Remove unwanted <script> tags
  const scripts = doc.querySelectorAll("script[src]");
  scripts.forEach((script) => {
    const src = script.getAttribute("src") ?? "";
    if (src.length > 0){
      const name = src.split('/').pop();
      if (!SCRIPTS[name]){
        script.remove();
      }
    }
  });

  //
  // 2. Remove style attribute from <main>
  //
  const mainEl = doc.querySelector("main");
  if (mainEl) {
    mainEl.setAttribute('data-blort', 'foo');
  }

  return doc.documentElement?.outerHTML ?? html;
}

// ------------------------------
// CLI handling
// ------------------------------
const QUARTO_PROJECT_OUTPUT_FILES: string = Deno.env.get('QUARTO_PROJECT_OUTPUT_FILES') ?? "";
if (QUARTO_PROJECT_OUTPUT_FILES.trim().length === 0){
  Deno.exit();
}
const files = QUARTO_PROJECT_OUTPUT_FILES.split(/[\n\s]+/gi);

for (const file of files) {
  try {
    const original = await Deno.readTextFile(file);
    const modified = transform(original);
    await Deno.writeTextFile(file, modified);
    console.log(`✔ Modified: ${file}`);
  } catch (err) {
    console.error(`✖ Error processing ${file}: ${err.message}`);
  }
}