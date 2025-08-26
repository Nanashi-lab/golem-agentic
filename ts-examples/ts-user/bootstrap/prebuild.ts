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

try {
    // !!! npx should come in as part of node js- that's what I found
    // so this may not be needed.
    execSync('npx --version', { stdio: 'ignore' });
    execSync('npx @rttist/typegen@0.2.0 generate', { stdio: 'inherit' });
} catch (e) {
    console.error('npx is not available. Please install Node.js with npm >= 5.2.0');
    process.exit(1);
}

const outputDir = path.resolve(__dirname, '../.generated');
fs.mkdirSync(outputDir, { recursive: true });

const wrapperPath = path.join(outputDir, 'index.ts');

const userEntryModule  = config.entry.replace(/\.ts$/, '');

// FIXME: Remove irrelevant comments
const wrapperContent = `
import '../.metadata/metadata.index';
import { Metadata } from '@golemcloud/golem-ts-sdk';
import { metadataCollection } from '../.metadata/metadata.index';
import {Project, Type} from "ts-morph";

// Legacy to be replaced
Metadata.clearMetadata("@golemcloud/golem-ts-sdk");

// Legacy to be replaced
metadataCollection.forEach(mod => mod.add(Metadata, false));

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
