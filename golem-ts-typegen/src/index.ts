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
import {Type, Symbol, Node, TypeMetadata, LiteTypeJSON} from "@golemcloud/golem-ts-types-core";
import * as fs from "node:fs";
import path from "path";

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

export function generateMetadata(sourceFiles: SourceFile[]) {
  updateMetadataFromSourceFiles(sourceFiles);
  saveTypeMetadata()
}

export function updateMetadataFromSourceFiles(sourceFiles: SourceFile[]) {
  for (const sourceFile of sourceFiles) {
    console.log(`Processing file: ${sourceFile.getFilePath()}`);
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



const METADATA_DIR = ".metadata";
const METADATA_FILE = "types.json";

export function saveTypeMetadata() {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR);
  }

  const json: Record<string, any> = {};

  const metadata =
      TypeMetadata.getAll();

  for (const [className, meta] of metadata.entries()) {
    const methodsObj: Record<string, any> = {};
    for (const [methodName, { methodParams, returnType }] of meta.methods) {
      methodsObj[methodName] = {
        methodParams: Object.fromEntries(
            Array.from(methodParams.entries()).map(([name, type]) => [name, type])
        ),
        returnType,
      };
    }

    json[className] = {
      constructorArgs: meta.constructorArgs,
      methods: methodsObj,
    };
  }

  const filePath = path.join(METADATA_DIR, METADATA_FILE);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf-8");
  console.log(`Type metadata saved to ${filePath}`);
}

export function loadTypeMetadata() {
  // Ensuring we clear the metadata before loading new

  TypeMetadata.clearMetadata();

  const filePath = path.join(METADATA_DIR, METADATA_FILE);
  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} does not exist`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);

  for (const [className, meta] of Object.entries(json)) {
    const constructorArgs = (meta as any).constructorArgs;
    const methodsMap = new Map<string, { methodParams: Map<string, Type>; returnType: Type }>();

    for (const [methodName, methodMeta] of Object.entries((meta as any).methods)) {
      const methodParamsMap = new Map<string, Type>();
      for (const [paramName, paramType] of Object.entries((methodMeta as any).methodParams)) {
        methodParamsMap.set(paramName, paramType as Type);
      }

      methodsMap.set(methodName, {
        methodParams: methodParamsMap,
        returnType: (methodMeta as any).returnType as Type,
      });
    }

    TypeMetadata.update(className, constructorArgs as any, methodsMap);
  }

  console.log(`Type metadata loaded from ${filePath}`);
}

export function buildJSONFromType(liteType: Type): LiteTypeJSON {
  // First, unwrap alias to get the underlying type
  const type = unwrapAlias(liteType);

  if (type.isBoolean()) {
    return { kind: 'boolean', name: type.getName() };
  }
  if (type.isNumber()) {
    return { kind: 'number', name: type.getName() };
  }
  if (type.isString()) {
    return { kind: 'string', name: type.getName() };
  }
  if (type.isBigInt()) {
    return { kind: 'bigint', name: type.getName() };
  }
  if (type.isNull()) {
    return { kind: 'null', name: type.getName() };
  }
  if (type.isUndefined()) {
    return { kind: 'undefined', name: type.getName() };
  }
  if (type.isArray()) {
    const elem = type.getArrayElementType();
    if (!elem) throw new Error('Array type without element type');
    return {
      kind: 'array',
      name: type.getName(),
      element: buildJSONFromType(elem),
    };
  }
  if (type.isTuple()) {
    return {
      kind: 'tuple',
      name: type.getName(),
      elements: type.getTupleElements().map(buildJSONFromType),
    };
  }
  if (type.isUnion()) {
    return {
      kind: 'union',
      name: type.getName(),
      types: type.getUnionTypes().map(buildJSONFromType),
    };
  }
  if (type.isObject() || type.isInterface()) {
    const props = type.getProperties().map((prop) => {
      const decl = prop.getDeclarations()[0];
      const optional = decl.hasQuestionToken?.() ?? false;
      const propType = prop.getTypeAtLocation(decl);
      return {
        name: prop.getName(),
        type: buildJSONFromType(propType),
        optional: optional || undefined,
      };
    });

    return {
      kind: type.isObject() ? 'object' : 'interface',
      name: type.getName(),
      properties: props,
    };
  }

  // Custom type with type arguments
  const typeArgs = type.getTypeArguments();
  if (typeArgs.length > 0) {
    return {
      kind: 'custom',
      name: type.getName()!,
      typeArgs: typeArgs.map(buildJSONFromType),
    };
  }

  // Alias fallback
  const aliasSymbol = type.getAliasSymbol();
  if (aliasSymbol) {
    const target = (aliasSymbol as any)._getAliasTarget?.() as Type;
    if (!target) throw new Error('Alias type missing target');
    return {
      kind: 'alias',
      name: type.getName()!,
      target: buildJSONFromType(target),
    };
  }

  throw new Error(`Unsupported type kind for JSON conversion: ${getTypeName(type)}`);
}
