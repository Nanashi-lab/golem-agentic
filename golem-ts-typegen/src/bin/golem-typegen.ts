#!/usr/bin/env node

import path from "path";
import { Command } from "commander";
import { Project } from "ts-morph";
import { saveTypeMetadata, updateMetadataFromSourceFiles } from "../index.js";
import { TypeMetadata } from "@golemcloud/golem-ts-types-core";

const program = new Command();

program
  .name("golem-typegen")
  .description("Generate type metadata from TypeScript sources")
  .argument("<tsconfig>", "Path to tsconfig.json")
  .option("-f, --files <patterns...>", "File globs to include", ["src/**/*"])
  .action((tsconfig: string, options: { files: string[] }) => {
    const project = new Project({ tsConfigFilePath: path.resolve(tsconfig) });
    const sourceFiles = project.getSourceFiles(options.files);
    console.log("Total source files " + sourceFiles.length);
    updateMetadataFromSourceFiles(sourceFiles);
    const result = TypeMetadata.getAll();
    console.log(
      "Metadata tracked for the following agent classes " +
        Array.from(result.entries())
          .map((entry) => entry[0])
          .join(", "),
    );
    console.log("Saving metadata..");
    saveTypeMetadata();
  });

program.parse();
