import * as csv from "jsr:@std/csv";
import * as yaml from "jsr:@std/yaml";


const fileContent = await Deno.readTextFile("registrants.csv");
const fileData = csv.parse(fileContent, { skipFirstRow: true, strip: true,  });

const authors = fileData.filter((row) => { return row["Presenting"] == "Yes"});

for await (const author of authors){
    const nameNorm = author["Name"]
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/\p{P}/gu, '')
                        .replace(/ø/g, 'o');
    const [_first, ...rest] = nameNorm.split(' ');
    const id = [rest.join("").toLowerCase()].join("_");
    const yamlObj = {
        author: {
            name: author["Name"].trim(),
            affiliation: [author["Organization NORM"].trim()]
        }
    }
    if (author["ORCID"].length > 0){
        yamlObj.author.orcid = author["ORCID"].trim()
    }
    yamlObj.author.metadata = {
        bio: author["Bio"]
    }
    const yamlOutput = yaml.stringify(yamlObj);
    await Deno.writeTextFile(`authors/${id}.yaml`, yamlOutput)
    console.log(`Wrote authors/${id}.yaml`);
    
}