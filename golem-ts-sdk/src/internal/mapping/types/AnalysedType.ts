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

import {Node, Type as TsType} from "@golemcloud/golem-ts-types-core";
import * as Either from "effect/Either";
import {numberToOrdinalKebab} from "./typeIndexOrdinal";

export interface NameTypePair {
  name: string;
  typ: AnalysedType;
}

export interface NameOptionTypePair {
  name: string;
  typ?: AnalysedType;
}

export type AnalysedType =
    | { kind: 'variant'; value: TypeVariant }
    | { kind: 'result'; value: TypeResult }
    | { kind: 'option'; value: TypeOption }
    | { kind: 'enum'; value: TypeEnum }
    | { kind: 'flags'; value: TypeFlags }
    | { kind: 'record'; value: TypeRecord }
    | { kind: 'tuple'; value: TypeTuple }
    | { kind: 'list'; value: TypeList }
    | { kind: 'string' }
    | { kind: 'chr' }
    | { kind: 'f64' }
    | { kind: 'f32' }
    | { kind: 'u64' }
    | { kind: 's64' }
    | { kind: 'u32' }
    | { kind: 's32' }
    | { kind: 'u16' }
    | { kind: 's16' }
    | { kind: 'u8' }
    | { kind: 's8' }
    | { kind: 'bool' }
    | { kind: 'handle'; value: TypeHandle };

export function getNameFromAnalysedType(typ: AnalysedType): string | undefined {
  switch (typ.kind) {
    case 'variant':
      return typ.value.name;
    case 'result':
      return typ.value.name;
    case 'option':
      return typ.value.name;
    case 'enum':
      return typ.value.name;
    case 'flags':
      return typ.value.name;
    case 'record':
      return typ.value.name;
    case 'tuple':
      return typ.value.name;
    case 'list':
      return typ.value.name;
    case 'handle':
      return typ.value.name;
    default:
      return undefined;
  }
}

export function getOwnerFromAnalysedType(typ: AnalysedType): string | undefined {
  switch (typ.kind) {
    case 'variant':
      return typ.value.owner;
    case 'result':
      return typ.value.owner;
    case 'option':
      return typ.value.owner;
    case 'enum':
      return typ.value.owner;
    case 'flags':
      return typ.value.owner;
    case 'record':
      return typ.value.owner;
    case 'tuple':
      return typ.value.owner;
    case 'list':
      return typ.value.owner;
    case 'handle':
      return typ.value.owner;
    default:
      return undefined;
  }
}

export interface TypeResult {
  name: string | undefined;
  owner: string | undefined;
  ok?: AnalysedType;
  err?: AnalysedType;
}

export interface TypeVariant {
  name: string | undefined;
  owner: string | undefined;
  cases: NameOptionTypePair[];
}

export interface TypeOption {
  name: string | undefined;
  owner: string | undefined;
  inner: AnalysedType;
}

export interface TypeEnum {
  name: string | undefined;
  owner: string | undefined;
  cases: string[];
}

export interface TypeFlags {
  name: string | undefined;
  owner: string | undefined;
  names: string[];
}

export interface TypeRecord {
  name: string | undefined;
  owner: string | undefined;
  fields: NameTypePair[];
}

export interface TypeTuple {
  name: string | undefined;
  owner: string | undefined;
  items: AnalysedType[];
}

export interface TypeList {
  name: string | undefined;
  owner: string | undefined;
  inner: AnalysedType;
}

export interface TypeHandle {
  name: string | undefined;
  owner: string | undefined;
  resourceId: AnalysedResourceId;
  mode: AnalysedResourceMode;
}

export type AnalysedResourceMode = 'owned' | 'borrowed';

export type AnalysedResourceId = number;


export const  field = (name: string, typ: AnalysedType): NameTypePair => ({ name, typ });

export const case_ = (name: string, typ: AnalysedType): NameOptionTypePair => ({ name, typ });
export const optCase = (name: string, typ?: AnalysedType): NameOptionTypePair => ({ name, typ });
export const unitCase=  (name: string): NameOptionTypePair => ({ name });

 export const bool =  (): AnalysedType => ({ kind: 'bool' });
 export const str =  (): AnalysedType => ({ kind: 'string' });
 export const chr = (): AnalysedType => ({ kind: 'chr' });
 export const f64 = (): AnalysedType => ({ kind: 'f64' });
 export const f32 = (): AnalysedType => ({ kind: 'f32' });
 export const u64 = (): AnalysedType => ({ kind: 'u64' });
 export const s64 = (): AnalysedType => ({ kind: 's64' });
 export const u32 = (): AnalysedType => ({ kind: 'u32' });
 export const s32 = (): AnalysedType => ({ kind: 's32' });
 export const u16 = (): AnalysedType => ({ kind: 'u16' });
 export const s16 =  (): AnalysedType => ({ kind: 's16' });
 export const u8 =  (): AnalysedType => ({ kind: 'u8' });
 export const s8 =  (): AnalysedType => ({ kind: 's8' });

 export const list = (inner: AnalysedType): AnalysedType => ({ kind: 'list', value: { name: undefined, owner: undefined, inner } });
export const option = (inner: AnalysedType): AnalysedType => ({ kind: 'option', value: { name: undefined, owner: undefined, inner } });
 export const tuple =  (items: AnalysedType[]): AnalysedType => ({ kind: 'tuple', value: { name: undefined, owner: undefined, items } });
 export const record = (fields: NameTypePair[]): AnalysedType => ({ kind: 'record', value: { name: undefined, owner: undefined, fields } });
 export const flags =  (names: string[]): AnalysedType => ({ kind: 'flags', value: { name: undefined, owner: undefined, names } });
 export const enum_ = (cases: string[]): AnalysedType => ({ kind: 'enum', value: { name: undefined, owner: undefined, cases } });
 export const variant = (cases: NameOptionTypePair[]): AnalysedType => ({ kind: 'variant', value: { name: undefined, owner: undefined, cases } });

 export const resultOk =  (ok: AnalysedType): AnalysedType =>
      ({ kind: 'result', value: { name: undefined, owner: undefined, ok } });
 export const resultErr = (err: AnalysedType): AnalysedType =>
      ({ kind: 'result', value: { name: undefined, owner: undefined, err } });

 export const result = (ok: AnalysedType, err: AnalysedType): AnalysedType =>
      ({ kind: 'result', value: { name: undefined, owner: undefined, ok, err } });


 export const handle =  (resourceId: AnalysedResourceId, mode: AnalysedResourceMode): AnalysedType =>
      ({ kind: 'handle', value: { name: undefined, owner: undefined, resourceId, mode } });


export function fromTsType(tsType: TsType): Either.Either<AnalysedType, string> {
  const visited = new Set<TsType>();
  return fromTsTypeInternal(tsType, visited);
}


export function fromTsTypeInternal(type: TsType, visited: Set<TsType>): Either.Either<AnalysedType, string> {


  const name =
     type.getName();

  switch (name) {
    case "Float64Array": return Either.right(list(f64()));
    case "Float32Array": return Either.right(list(f32()));
    case "Int8Array":    return Either.right(list(s8()));
    case "Uint8Array":   return Either.right(list(u8()));
    case "Int16Array":   return Either.right(list(s16()));
    case "Uint16Array":  return Either.right(list(u16()));
    case "Int32Array":   return Either.right(list(s32()));
    case "Uint32Array":  return Either.right(list(u32()));
    case "BigInt64Array":  return Either.right(list(s64()));
    case "BigUint64Array": return Either.right(list(u64()));
  }

  if (type.isPromise()) {
    const inner = type.getPromiseElementType();

    if (!inner) {
      return Either.left(`Unable to infer the type of promise`)
    }

    return fromTsTypeInternal(inner, visited);
  }

  if (type.isBoolean() || name === 'true' || name === 'false')  {
      return Either.right(bool())
    }

  if (name === "Map" && type.getTypeArguments().length === 2) {
    const [keyT, valT] = type.getTypeArguments();

    const key = fromTsTypeInternal(keyT, visited);
    const value = fromTsTypeInternal(valT, visited);


    return Either.zipWith(key, value, (k, v) =>
        list(tuple([k, v])));
  }

  if (name === "Iterable" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    return Either.map(fromTsTypeInternal(inner, visited), (result) => list(result));
  }

  if (name === "AsyncIterable" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    return Either.map(fromTsTypeInternal(inner, visited), (result) => list(result));
  }


  if (name === "Iterator" && type.getTypeArguments().length === 1) {
    const inner = type.getTypeArguments()[0];
    return Either.map(fromTsTypeInternal(inner, visited), (result) => list(result));
  };

  if (type.isTuple()) {
    const tupleElems = Either.all(type.getTupleElements().map(el => fromTsTypeInternal(el, visited)));

    return Either.map(tupleElems, (items) => tuple(items));
  };

  if (type.isArray()) {
    const arrayElementType = type.getArrayElementType();

    if (!arrayElementType) {
      return Either.left("Unable to determine the array element type");
    }

    const elemType = fromTsTypeInternal(arrayElementType, visited);

    return Either.map(elemType, (inner) => list(inner));
  }

  if (type.isUnion()) {
    let fieldIdx = 1;

    const possibleTypes: NameOptionTypePair[] = [];

    let boolTracked = false;

    for (const t of type.getUnionTypes()) {
      if (t.isBoolean() || t.getName() === "false" || t.getName() === "true") {
        if (boolTracked) {
          continue;
        }
        boolTracked = true;
        possibleTypes.push({
          name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
          typ: bool()
        });
      } else {
        Either.map(fromTsTypeInternal(t, visited), (result) => {
          possibleTypes.push({
            name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
            typ: result,
          });
        });
      }
    }

    return Either.right(variant(possibleTypes));
  }


  if (type.isObject()) {
    const result = Either.all(type.getProperties().map((prop) => {
      const type = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const nodes: Node[] = prop.getDeclarations();
      const node = nodes[0];

      const tsType = fromTsTypeInternal(type, visited);

      if ((Node.isPropertySignature(node) || Node.isPropertyDeclaration(node)) && node.hasQuestionToken()) {
        return Either.map(tsType, (analysedType) => {
          return field(prop.getName(), option(analysedType))
        });
      }

      return Either.map(tsType, (analysedType) => {
        return field(prop.getName(), analysedType)
      })
    }));

    return Either.map(result, (fields) => record(fields));
  }

  if (type.isInterface()) {
    const result = Either.all(type.getProperties().map((prop) => {
      const type = prop.getTypeAtLocation(prop.getValueDeclarationOrThrow());
      const nodes: Node[] = prop.getDeclarations();
      const node = nodes[0];

      const tsType = fromTsTypeInternal(type, visited);

      if ((Node.isPropertySignature(node) || Node.isPropertyDeclaration(node)) && node.hasQuestionToken()) {
        return Either.map(tsType, (analysedType) => {
          return field(prop.getName(), option(analysedType))
        });
      }

      return Either.map(tsType, (analysedType) => {
        return field(prop.getName(), analysedType)
      })
    }));

    return Either.map(result, (fields) => record(fields));

  }

  if (type.isNull()) {
    return Either.right(tuple([]))
  }

  if (type.isBigInt()) {
    return Either.right(u64())
  }


  if (type.isUndefined()) {
    return Either.right(tuple([]))
  }

  if (type.isNumber()) {
    return Either.right(s32()) // For the same reason - as an example - Rust defaults to i32
  }

  if (type.isString()) {
    return Either.right(str())
  }

  return Either.left(`The following type is not supported as argument or return type in agentic context. Type Name: ${name}. Please report this issue to Golem Cloud`);

}
