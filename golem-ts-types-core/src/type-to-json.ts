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

import { unwrapAlias, Type, getTypeName } from './type-lite';
import { LiteTypeJSON } from './type-json';

export function buildJSONFromType(type: Type): LiteTypeJSON {
  type = unwrapAlias(type);

  if (type.isBoolean()) return { kind: 'boolean' };
  if (type.isNumber()) return { kind: 'number' };
  if (type.isString()) return { kind: 'string' };
  if (type.isBigInt()) return { kind: 'bigint' };
  if (type.isNull()) return { kind: 'null' };
  if (type.isUndefined()) return { kind: 'undefined' };

  if (type.isArray()) {
    const elem = type.getArrayElementType();
    if (!elem) throw new Error('Missing element type in Array');
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
    const props = type.getProperties().map((sym) => {
      const decl = sym.getDeclarations()[0];
      const optional = decl.hasQuestionToken?.() ?? false;
      const propType = sym.getTypeAtLocation(decl);
      return {
        name: sym.getName(),
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

  if (type.isPromise()) {
    const elementType = type.getPromiseElementType();

    if (!elementType) throw new Error('Missing element type in Promise');

    return {
      kind: 'promise',
      name: getTypeName(type),
      element: buildJSONFromType(elementType),
    };
  }

  if (type.isMap()) {
    const keyAndValue = type.getTypeArguments();

    if (keyAndValue.length !== 2)
      throw new Error('Map must have exactly two type arguments');

    const key = keyAndValue[0];
    const value = keyAndValue[1];

    const keyJson = buildJSONFromType(key);
    const valueJson = buildJSONFromType(value);

    return {
      kind: 'map',
      name: getTypeName(type),
      typeArgs: [keyJson, valueJson],
    };
  }

  const aliasSym = type.getAliasSymbol();
  if (aliasSym) {
    const target = (aliasSym as any)._getAliasTarget?.() as Type;
    if (!target) throw new Error('Alias missing target');
    return {
      kind: 'alias',
      name: type.getName()!,
      target: buildJSONFromType(target),
    };
  }

  throw new Error(
    `Failed to convert Type to JSON type. Unsupported type: ${type.getName() ?? 'unknown'}`,
  );
}
