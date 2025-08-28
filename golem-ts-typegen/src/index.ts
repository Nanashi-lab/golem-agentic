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

import {Type as TsMorphType, Node as TsMorphNode, SourceFile} from "ts-morph";
import {Type, Symbol, Node, TypeMetadata} from "@golemcloud/golem-ts-types-core";

export function getFromTsMorph(tsMorphType: TsMorphType): Type {
  const type = unwrapAlias(tsMorphType);
  const name = getTypeName(type);

  switch (name) {
    case "Float64Array":
      return new Type({
        kind: "array",
        name: "Float64Array",
      });
    case "Float32Array":
      return new Type({
        kind: "array",
        name: "Float32Array",
      });
    case "Int8Array":
      return new Type({
        kind: "array",
        name: "Int8Array",
      });
    case "Uint8Array":
      return new Type({
        kind: "array",
        name: "Uint8Array",
      });
    case "Int16Array":
      return new Type({
        kind: "array",
        name: "Int16Array",
      });
    case "Uint16Array":
      return new Type({
        kind: "array",
        name: "Uint16Array",
      });
    case "Int32Array":
      return new Type({
        kind: "array",
        name: "Int32Array",
      });
    case "Uint32Array":
      return new Type({
        kind: "array",
        name: "Uint32Array",
      });
    case "BigInt64Array":
      return new Type({
        kind: "array",
        name: "BigInt64Array",
      });
    case "BigUint64Array":
      return new Type({
        kind: "array",
        name: "BigUint64Array",
      });
  }

  if (name === "Promise" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    const promiseType = getFromTsMorph(inner);

    return new Type({
      kind: "custom",
      name: "Promise",
      element: promiseType,
    });
  }

  if (type.isBoolean() || name === "true" || name === "false") {
    return new Type({ kind: "boolean", name });
  }

  if (name === "Map" && type.getTypeArguments().length === 2) {
    const [keyT, valT] = type.getTypeArguments();

    const key = getFromTsMorph(keyT);
    const value = getFromTsMorph(valT);

    return new Type({
      kind: "custom",
      name: "Map",
      typeArgs: [key, value],
    });
  }

  if (name === "Iterable" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    const elementType = getFromTsMorph(inner);
    return new Type({
      kind: "custom",
      name: "Iterable",
      element: elementType,
    });
  }

  if (name === "AsyncIterable" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    const elementType = getFromTsMorph(inner);
    return new Type({
      kind: "custom",
      name: "AsyncIterable",
      element: elementType,
    });
  }

  if (name === "Iterator" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    const elementType = getFromTsMorph(inner);
    return new Type({
      kind: "custom",
      name: "Iterator",
      element: elementType,
    });
  }

  if (name === "AsyncIterator" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    const elementType = getFromTsMorph(inner);
    return new Type({
      kind: "custom",
      name: "AsyncIterator",
      element: elementType,
    });
  }

  if (type.isTuple()) {
    const tupleElems = type.getTupleElements().map((el) => getFromTsMorph(el));

    return new Type({
      kind: "tuple",
      elements: tupleElems,
    });
  }

  if (type.isArray()) {
    const elementType = type.getArrayElementType();
    if (!elementType) {
      throw new Error("Array type without element type");
    }
    const element = getFromTsMorph(elementType);

    return new Type({
      kind: "array",
      element,
    });
  }

  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes().map((t) => getFromTsMorph(t));

    return new Type({
      kind: "union",
      unionTypes,
    });
  }

  if (type.isInterface()) {
    const result: Symbol[] = type.getProperties().map((prop) => {
      const type = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const nodes = prop.getDeclarations();
      const node = nodes[0];
      const tsType = getFromTsMorph(type);
      const propName = prop.getName();

      if (
        (TsMorphNode.isPropertySignature(node) ||
          TsMorphNode.isPropertyDeclaration(node)) &&
        node.hasQuestionToken()
      ) {
        return new Symbol({
          name: propName,
          declarations: [new Node("PropertyDeclaration", true)],
          typeAtLocation: tsType,
        });
      } else {
        return new Symbol({
          name: propName,
          declarations: [new Node("PropertyDeclaration", false)],
          typeAtLocation: tsType,
        });
      }
    });

    return new Type({
      kind: "interface",
      name,
      properties: result,
    });
  }

  if (type.isObject()) {
    const result: Symbol[] = type.getProperties().map((prop) => {
      const type = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const nodes = prop.getDeclarations();
      const node = nodes[0];
      const tsType = getFromTsMorph(type);
      const propName = prop.getName();

      if (
        (TsMorphNode.isPropertySignature(node) ||
          TsMorphNode.isPropertyDeclaration(node)) &&
        node.hasQuestionToken()
      ) {
        return new Symbol({
          name: propName,
          declarations: [new Node("PropertyDeclaration", true)],
          typeAtLocation: tsType,
        });
      } else {
        return new Symbol({
          name: propName,
          declarations: [new Node("PropertyDeclaration", false)],
          typeAtLocation: tsType,
        });
      }
    });

    return new Type({
      kind: "object",
      name,
      properties: result,
    });
  }

  if (type.isNull()) {
    return new Type({ kind: "null", name: "null" });
  }

  if (type.isBigInt()) {
    return new Type({ kind: "bigint", name: "bigint" });
  }

  if (type.isUndefined()) {
    return new Type({ kind: "undefined", name: "undefined" });
  }

  if (type.isNumber()) {
    return new Type({ kind: "number", name: "number" });
  }

  if (type.isString()) {
    return new Type({ kind: "string", name: "string" });
  }

  throw new Error("Unknown type: " + type.getText() + " with name: " + name);
}

export function getTypeName(type: TsMorphType): string | undefined {
  const rawName = type.getSymbol()?.getName();

  if (!rawName || rawName === "__type") {
    const alias = type.getAliasSymbol()?.getName();

    if (!alias || alias === "__type") {
      return type.getText();
    }

    return alias;
  }

  return rawName;
}

export function unwrapAlias(type: TsMorphType): TsMorphType {
  let current = type;

  const visited = new Set<TsMorphType>();

  while (true) {
    const aliasSymbol = current.getAliasSymbol();
    if (!aliasSymbol || visited.has(current)) break;
    visited.add(current);

    const decl = aliasSymbol.getDeclarations()[0];
    if (!decl) break;

    const realType = decl.getType();

    if (realType === current) break;
    current = realType;
  }

  return current;
}


export function updateMetadataFromSourceFiles(sourceFiles: SourceFile[]) {
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
}