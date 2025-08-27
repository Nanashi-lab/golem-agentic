import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// !!! May be instead of a separate bootstrap/prebuild.ts file,
// we can make it generate directly with rollup - I don't know - the idea
// is we have to have this prebuild step to generate the metadata of user module
// There is no need of transformer because we are not transforming any code/imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

// Entry point of user may be referred in multiple places.
// and hence buildrc.json.
// The entry point referred in rollup.config.js is always the generated module
const configPath = path.resolve(__dirname, '../.buildrc.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const outputDir = path.resolve(__dirname, '../.generated');
fs.mkdirSync(outputDir, { recursive: true });

const wrapperPath = path.join(outputDir, 'index.ts');

const userEntryModule  = config.entry.replace(/\.ts$/, '');

// FIXME: Remove irrelevant comments
const wrapperContent = `
import {Project, Type} from "ts-morph";
import { TypeMetadata } from "@golemcloud/golem-ts-sdk";

const project = new Project({
  tsConfigFilePath: "./tsconfig.json",
});

const sourceFiles = project.getSourceFiles("src/**/*.ts");

TypeMetadata.updateFromSourceFiles(sourceFiles)

// Import the user module after metadata is ready
// this is to be done this way otherwise rollup ends up generating the module,
// where loading the metadata comes after the user module is loaded - resulting in errors.
export default (async () => {
  return await import("../${userEntryModule}");
})();

`;

fs.writeFileSync(wrapperPath, wrapperContent);
