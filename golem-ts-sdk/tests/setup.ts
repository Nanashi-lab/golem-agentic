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

// Load type metadata loads the type-metadata that was saved into .metadata directory
// when running `npm run test`

import {
  buildTypeFromJSON,
  LiteTypeJSON,
  Type,
  TypeMetadata,
} from '@golemcloud/golem-ts-types-core';
import path from 'path';
import * as fs from 'node:fs';
const METADATA_DIR = '.metadata';
const METADATA_FILE = 'types.json';

// To be moved to SDK
TypeMetadata.clearMetadata();

const filePath = path.join(METADATA_DIR, METADATA_FILE);
if (!fs.existsSync(filePath)) {
  throw new Error(`${filePath} does not exist`);
}

const raw = fs.readFileSync(filePath, 'utf-8');
const json = JSON.parse(raw);

for (const [className, meta] of Object.entries(json)) {
  const constructorArgsJSON = (meta as any).constructorArgs as Array<{
    name: string;
    type: LiteTypeJSON;
  }>;

  const constructorArgs = constructorArgsJSON.map((arg) => ({
    name: arg.name,
    type: buildTypeFromJSON(arg.type),
  }));

  const methodsMap = new Map<
    string,
    { methodParams: Map<string, Type>; returnType: Type }
  >();

  for (const [methodName, methodMeta] of Object.entries(
    (meta as any).methods,
  )) {
    const methodParamsMap = new Map<string, Type>();
    for (const [paramName, paramJSON] of Object.entries(
      (methodMeta as any).methodParams,
    )) {
      methodParamsMap.set(
        paramName,
        buildTypeFromJSON(paramJSON as LiteTypeJSON),
      );
    }

    methodsMap.set(methodName, {
      methodParams: methodParamsMap,
      returnType: buildTypeFromJSON(
        (methodMeta as any).returnType as LiteTypeJSON,
      ),
    });
  }

  TypeMetadata.update(className, constructorArgs, methodsMap);
}
