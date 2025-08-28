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
import { Node } from './node';
import { LiteTypeJSON } from './type-json';
import { Type } from './type-lite';

export function buildTypeFromJSON(json: LiteTypeJSON): Type {
  switch (json.kind) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'bigint':
    case 'null':
    case 'undefined':
      return new Type({ kind: json.kind, name: json.name });

    case 'array': {
      const elem = buildTypeFromJSON(json.element);
      return new Type({
        kind: 'array',
        name: json.name ?? 'Array',
        element: elem,
      });
    }

    case 'tuple': {
      const elems = json.elements.map(buildTypeFromJSON);
      return new Type({
        kind: 'tuple',
        name: json.name ?? 'Tuple',
        elements: elems,
      });
    }

    case 'union': {
      const types = json.types.map(buildTypeFromJSON);
      return new Type({
        kind: 'union',
        name: json.name ?? 'Union',
        unionTypes: types,
      });
    }

    case 'object': {
      const props = json.properties.map(
        (p) =>
          new Symbol({
            name: p.name,
            declarations: [new Node('PropertySignature', !!p.optional)],
            typeAtLocation: buildTypeFromJSON(p.type),
          }),
      );
      return new Type({
        kind: 'object',
        name: json.name ?? 'Object',
        properties: props,
      });
    }

    case 'interface': {
      const props = json.properties.map(
        (p) =>
          new Symbol({
            name: p.name,
            declarations: [new Node('PropertyDeclaration', !!p.optional)],
            typeAtLocation: buildTypeFromJSON(p.type),
          }),
      );
      return new Type({
        kind: 'interface',
        name: json.name ?? 'Interface',
        properties: props,
      });
    }

    case 'alias': {
      const target = buildTypeFromJSON(json.target);
      const aliasDecl = new Node('TypeAlias', false);
      const aliasSym = new Symbol({
        name: json.name,
        declarations: [aliasDecl],
        aliasTarget: target,
      });
      return new Type({
        kind: 'alias',
        name: json.name,
        aliasSymbol: aliasSym,
      });
    }

    case 'promise':
      const elemType = buildTypeFromJSON(json.element);
      return new Type({
        kind: 'promise',
        name: json.name ?? 'Promise',
        element: elemType,
      });

    case 'map':
      const typeArgs = (json.typeArgs ?? []).map(buildTypeFromJSON);
      return new Type({
        kind: 'map',
        name: json.name ?? 'Map',
        typeArgs: typeArgs,
      });


    default:
      throw new Error(`Unsupported type kind: ${(json as any).kind}`);

  }
}
