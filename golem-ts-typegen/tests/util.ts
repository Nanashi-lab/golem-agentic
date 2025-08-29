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
  getTypeName,
  Type,
  TypeMetadata,
} from "@golemcloud/golem-ts-types-core";

import "./setup";

/**
 * getAll functionality reads the type metadata from .metadata directory
 * The type metadata is loaded to type metadata
 * by `setup` module.
 */
export function getAll() {
  TypeMetadata.loadFromJson(
    require("../.metadata/generated-types.js").Metadata,
  );

  return TypeMetadata.getAll();
}

// Get an Interface Type from .metadata directory
export function getInterfaceType(): Type {
  return fetchType("TestInterfaceType");
}

// Get a Map Type from .metadata directory
// ts-morph discards type alias
export function getTestMapType(): Type {
  return fetchType("Map");
}

// Get an Object Type from .metadata directory
// Note that alias for object is kept intact.
export function getObjectType(): Type {
  return fetchType("ObjectType");
}

// Get a complex Object Type from .metadata directory
export function getComplexObjectType(): Type {
  return fetchType("ObjectComplexType");
}

// Get a List Type from .metadata directory
// ts-morph discards type alias
export function getTestListOfObjectType(): Type {
  return fetchType("Array");
}

// Get a Union Type from .metadata directory
// Here alias is kept intact by ts-morph
export function getUnionType(): Type {
  return fetchType("UnionType");
}

// Get a Union Type from .metadata directory
// Here alias is kept intact by ts-morph
export function getUnionComplexType(): Type {
  return fetchType("UnionComplexType");
}

// Get a Tuple Type from .metadata directory
// Here alias is kept intact by ts-morph
export function getTupleType(): Type {
  return fetchType("TupleType");
}

// Get a boolean Type from .metadata directory
export function getBooleanType(): Type {
  return fetchType("boolean");
}

// Get a string Type from .metadata directory
export function getStringType(): Type {
  return fetchType("string");
}

// Get a number Type from .metadata directory
export function getNumberType(): Type {
  return fetchType("number");
}

// Get a Promise Type from .metadata directory
export function getPromiseType(): Type {
  return fetchType("Promise");
}

// Fetch a type by its name from the loaded metadata (loaded by setup module)
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
        const typeName = getTypeName(t);
        return typeName === typeNameInTestData;
      });

      if (param) {
        return param[1];
      }
    }
  }

  throw new Error(`Type ${typeNameInTestData} not found in metadata`);
}
