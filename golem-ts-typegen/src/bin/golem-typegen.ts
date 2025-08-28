#!/usr/bin/env node

import path from "path";
import { Command } from "commander";
import { Project } from "ts-morph";
import { updateMetadataFromSourceFiles } from "../index.js";

const program = new Command();

program
    .name("golem-typegen")
    .description("Generate type metadata from TypeScript sources")
    .argument("<tsconfig>", "Path to tsconfig.json")
    .option("-f, --files <patterns...>", "File globs to include", ["src/**/*"])
    .action((tsconfig: string, options: { files: string[] }) => {
        const project = new Project({ tsConfigFilePath: path.resolve(tsconfig) });
        const sourceFiles = project.getSourceFiles(options.files);
        updateMetadataFromSourceFiles(sourceFiles);
        console.log("Type Metadata successfully generated");
    });

program.parse();