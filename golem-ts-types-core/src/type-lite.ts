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

import { Symbol } from './symbol';

type Kind =
  | 'boolean'
  | 'number'
  | 'string'
  | 'bigint'
  | 'null'
  | 'undefined'
  | 'array'
  | 'tuple'
  | 'union'
  | 'object'
  | 'interface'
  | 'promise'
  | 'map'
  | 'alias';

export class Type {
  private readonly kind: Kind;
  private readonly name?: string;
  private readonly element?: Type;
  private readonly elements?: Type[];
  private readonly unionTypes?: Type[];
  private readonly properties?: Symbol[];
  private readonly typeArgs?: Type[];
  private readonly aliasSymbol?: Symbol;

  constructor(from: {
    kind: Kind;
    name?: string;
    element?: Type;
    elements?: Type[];
    unionTypes?: Type[];
    properties?: Symbol[];
    typeArgs?: Type[];
    aliasSymbol?: Symbol;
  }) {
    this.kind = from.kind;
    this.name = from.name;
    this.element = from.element;
    this.elements = from.elements;
    this.unionTypes = from.unionTypes;
    this.properties = from.properties;
    this.typeArgs = from.typeArgs;
    this.aliasSymbol = from.aliasSymbol;
  }

  getName(): string | undefined {
    return this.name;
  }

  getTypeArguments(): Type[] {
    return this.typeArgs ?? [];
  }

  getPromiseElementType(): Type | undefined {
    return this.element;
  }

  isBoolean(): boolean {
    return this.kind === 'boolean';
  }

  isTuple(): boolean {
    return this.kind === 'tuple';
  }
  getTupleElements(): Type[] {
    return this.elements ?? [];
  }

  isArray(): boolean {
    return this.kind === 'array';
  }
  getArrayElementType(): Type | undefined {
    return this.element;
  }

  isUnion(): boolean {
    return this.kind === 'union';
  }

  isPromise(): boolean {
    return this.kind === 'promise';
  }

  isMap(): boolean {
    return this.kind === 'map';
  }

  getUnionTypes(): Type[] {
    return this.unionTypes ?? [];
  }

  isObject(): boolean {
    return this.kind === 'object';
  }
  isInterface(): boolean {
    return this.kind === 'interface';
  }
  getProperties(): Symbol[] {
    return this.properties ?? [];
  }

  isNull(): boolean {
    return this.kind === 'null';
  }
  isBigInt(): boolean {
    return this.kind === 'bigint';
  }
  isUndefined(): boolean {
    return this.kind === 'undefined';
  }
  isNumber(): boolean {
    return this.kind === 'number';
  }
  isString(): boolean {
    return this.kind === 'string';
  }

  getAliasSymbol(): Symbol | undefined {
    return this.aliasSymbol;
  }
}

export function getTypeName(t: Type): string {
  if (t.getName) return t.getName()!;
  if (t.isArray()) return 'Array';
  if (t.isTuple()) return 'Tuple';
  if (t.isUnion()) return 'Union';
  if (t.isObject()) return 'Object';
  if (t.isInterface()) return 'Interface';
  if (t.isBoolean()) return 'boolean';
  if (t.isNumber()) return 'number';
  if (t.isString()) return 'string';
  if (t.isNull()) return 'null';
  if (t.isUndefined()) return 'undefined';
  if (t.isBigInt()) return 'bigint';
  if (t.isMap()) return 'Map';
  if (t.isPromise()) return 'Promise';
  return 'unknown';
}

export function unwrapAlias(t: Type): Type {
  let current = t;
  const seen = new Set<Type>();
  while (true) {
    const alias = current.getAliasSymbol();
    if (!alias || seen.has(current)) break;
    seen.add(current);

    const decl = alias.getDeclarations()[0];
    if (!decl) break;

    const target = (alias as any)._getAliasTarget?.() as Type | undefined;
    if (!target || target === current) break;

    current = target;
  }
  return current;
}
