#!/usr/bin/env node

import { Project } from "ts-morph";
import {updateMetadataFromSourceFiles} from "../index";
import path from "path";
import { Command } from "commander";

const program = new Command();

program
    .name("golem-typegen")
    .description("Generate type metadata from TypeScript sources using ts-morph")
    .argument("<tsconfig>", "Path to tsconfig.json (of target project)")
    .option("-f, --files <glob>", "Glob of files to include", "src/**/*.ts")
    .action((tsconfig, options) => {
        const project = new Project({
            tsConfigFilePath: path.resolve(tsconfig),
        });

        const sourceFiles = project.getSourceFiles(options.files);

        updateMetadataFromSourceFiles(sourceFiles);

        console.log("Type Metadata successfully generated");
    });

program.parse(process.argv);
