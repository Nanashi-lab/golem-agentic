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

import {
  BaseMetadataLibrary,
  GlobalMetadata,
  Type as LegacyType,
} from 'rttist';
import { AgentClassName } from './newTypes/agentClassName';
import * as Option from 'effect/Option';
import { SourceFile, Type } from 'ts-morph';

export const PackageName = '@golemcloud/golem-ts-sdk';

export const Metadata = new BaseMetadataLibrary(
  {
    nullability: false,
  },
  PackageName,
  GlobalMetadata,
);

type ClassNameString = string;
type MethodNameString = string;

type MethodParams = Map<string, Type>;

type ReturnType = Type;

type ConstructorArg = { name: string; type: Type };

type ClassMetadata = {
  constructorArgs: ConstructorArg[];
  methods: Map<
    MethodNameString,
    { methodParams: MethodParams; returnType: ReturnType }
  >;
};

const MetadataV2 = new Map<ClassNameString, ClassMetadata>();

export const TypeMetadata = {
  updateFromSourceFiles(sourceFiles: SourceFile[]) {
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
              type: p.getType(),
            })) ?? [];

        const methods = new Map();
        for (const method of classDecl.getMethods()) {
          const methodParams = new Map(
            method.getParameters().map((p) => [p.getName(), p.getType()]),
          );
          const returnType = method.getReturnType();
          methods.set(method.getName(), { methodParams, returnType });
        }

        TypeMetadata.update(className, constructorArgs, methods);
      }
    }
  },

  update(
    className: ClassNameString,
    constructorArgs: ConstructorArg[],
    methods: Map<
      MethodNameString,
      { methodParams: MethodParams; returnType: ReturnType }
    >,
  ) {
    MetadataV2.set(className, { constructorArgs, methods });
  },

  get(className: ClassNameString): ClassMetadata | undefined {
    return MetadataV2.get(className);
  },

  has(className: ClassNameString): boolean {
    return MetadataV2.has(className);
  },

  getAll(): Map<ClassNameString, ClassMetadata> {
    return MetadataV2;
  },

  updateLegacy(metadata: Array<any>): void {
    Metadata.clearMetadata(PackageName);
    metadata.forEach((mod) => mod.add(Metadata, false));
  },

  lookupClassMetadata(className: AgentClassName): Option.Option<LegacyType> {
    const types = Metadata.getTypes().filter(
      (type) => type.isClass() && type.name === className.value,
    );

    if (types.length === 0) {
      return Option.none();
    }

    return Option.some(types[0]);
  },
};
