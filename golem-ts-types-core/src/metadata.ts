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

import { Type } from './type-lite';

type ClassNameString = string;
type MethodNameString = string;

export type MethodParams = Map<string, Type>;

export type ConstructorArg = { name: string; type: Type };

export type ClassMetadata = {
  constructorArgs: ConstructorArg[];
  methods: Map<
    MethodNameString,
    { methodParams: MethodParams; returnType: Type }
  >;
};

const Metadata = new Map<ClassNameString, ClassMetadata>();

export const TypeMetadata = {
  update(
    className: ClassNameString,
    constructorArgs: ConstructorArg[],
    methods: Map<
      MethodNameString,
      { methodParams: MethodParams; returnType: Type }
    >,
  ) {
    console.log(`Updating metadata for class: ${className}`);
    Metadata.set(className, { constructorArgs, methods });
  },

  get(className: string): ClassMetadata | undefined {
    return Metadata.get(className);
  },

  clearMetadata(): void {
    Metadata.clear();
    return;
  },

  getAll(): Map<ClassNameString, ClassMetadata> {
    return Metadata;
  },

  clearAll(): void {
    Metadata.clear();
  },
};
