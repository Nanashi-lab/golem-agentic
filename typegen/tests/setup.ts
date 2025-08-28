// Copyright 2024-2025 Golem Cloud
//
// Licensed under the Golem Source License v1.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://license.golem.cloud/LICENSE
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Project } from 'ts-morph';
import { TypeMetadata } from '@golemcloud/golem-ts-types-core';
import { getFromTsMorph } from '../src/index.js';

const project = new Project({
  tsConfigFilePath: 'packages/core/tsconfig.json',
});

const sourceFiles =
  project.getSourceFiles('packages/core/tests/testData.ts');

for (const sourceFile of sourceFiles) {
  const classes = sourceFile.getClasses();

  for (const classDecl of classes) {
    const className = classDecl.getName();
    if (!className) continue;

    const constructorArgs =
      classDecl
        .getConstructors()[0]
        ?.getParameters()
        .map((p) => ({
          name: p.getName(),
          type: getFromTsMorph(p.getType()),
        })) ?? [];

    const methods = new Map();
    for (const method of classDecl.getMethods()) {
      const methodParams = new Map(
        method.getParameters().map((p) => {
          return [p.getName(), getFromTsMorph(p.getType())];
        }),
      );

      const returnType = getFromTsMorph(method.getReturnType());
      methods.set(method.getName(), { methodParams, returnType });
    }

    TypeMetadata.update(className, constructorArgs, methods);
  }
}

