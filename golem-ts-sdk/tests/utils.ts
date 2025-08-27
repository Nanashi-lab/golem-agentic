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

import { getTypeName, TypeMetadata } from '../src/typeMetadata';
import { Type } from 'ts-morph';
import './setup';
import {
  AnalysedType,
  NameTypePair,
} from '../src/internal/mapping/types/AnalysedType';

export function getAll() {
  return TypeMetadata.getAll();
}

export function getTestInterfaceType(): Type {
  return fetchType('TestInterfaceType');
}

export function getTestMapType(): Type {
  return fetchType('MapType');
}

export function getTestObjectType(): Type {
  return fetchType('ObjectType');
}

export function getTestListType(): Type {
  return fetchType('ListType');
}

export function getTestListOfObjectType(): Type {
  return fetchType('ListComplexType');
}

export function getUnionType(): Type {
  return fetchType('UnionType');
}

export function getUnionComplexType(): Type {
  return fetchType('UnionComplexType');
}

export function getTupleType(): Type {
  return fetchType('TupleType');
}

export function getTupleComplexType(): Type {
  return fetchType('TupleComplexType');
}

export function getBooleanType(): Type {
  return fetchType('boolean');
}

export function getStringType(): Type {
  return fetchType('string');
}

export function getNumberType(): Type {
  return fetchType('number');
}

export function getPromiseType(): Type {
  return fetchType('Promise');
}

export function getRecordFieldsFromAnalysedType(
  analysedType: AnalysedType,
): NameTypePair[] | undefined {
  return analysedType.kind === 'record' ? analysedType.value.fields : undefined;
}

function fetchType(typeNameInTestData: string): Type {
  const classMetadata = Array.from(getAll()).map(([_, v]) => v);

  for (const type of classMetadata) {
    const constructorArg = type.constructorArgs.find((arg) => {
      const typeName = getTypeName(arg.type);
      return typeName === typeNameInTestData;
    });

    if (constructorArg) {
      return constructorArg.type;
    }

    const methods = Array.from(type.methods.values());

    for (const method of methods) {
      if (
        method.returnType &&
        getTypeName(method.returnType) === typeNameInTestData
      ) {
        return method.returnType;
      }

      const param = Array.from(method.methodParams.entries()).find(([_, t]) => {
        return getTypeName(t) === typeNameInTestData;
      });

      if (param) {
        return param[1];
      }
    }
  }

  throw new Error(`Type ${typeNameInTestData} not found in metadata`);
}
