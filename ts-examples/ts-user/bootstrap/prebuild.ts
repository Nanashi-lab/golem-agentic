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
    execSync('npx golem-typegen ./tsconfig.json', { stdio: 'inherit' });
} catch (e) {
    console.error('npx is not available. Please install Node.js with npm >= 5.2.0');
    process.exit(1);
}

const outputDir = path.resolve(__dirname, '../.generated');
fs.mkdirSync(outputDir, { recursive: true });

const wrapperPath = path.join(outputDir, 'index.ts');

const userEntryModule  = config.entry.replace(/\.ts$/, '');

const wrapperContent = `
import { TypeMetadata } from '@golemcloud/golem-ts-types-core';
import { Metadata } from '../.metadata/generated-types';

TypeMetadata.loadFromJson(Metadata);

export default (async () => {
  return await import("../${userEntryModule}");
})();

`;

fs.writeFileSync(wrapperPath, wrapperContent);
