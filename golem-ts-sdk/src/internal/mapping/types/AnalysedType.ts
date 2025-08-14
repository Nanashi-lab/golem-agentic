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

import {GenericType, InterfaceType, ObjectType, Type, TypeAliasType, TypeKind, UnionType} from "rttist";
import {Type as TsType} from "rttist/dist/Type";
import * as Either from "effect/Either";
import {isInBuiltResult} from "./inbuilt";
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


export function fromTsType(type: TsType): Either.Either<AnalysedType, string> {
  switch (type.kind) {
    case TypeKind.Boolean:
      return Either.right(bool());
    case TypeKind.False:
      return Either.right(bool());
    case TypeKind.True:
      return Either.right(bool());
    case TypeKind.DataView:
      return Either.right(list(u8()));
    case TypeKind.MapDefinition:
      const mapKeyType = type.getTypeArguments?.()[0];
      const mapValueType = type.getTypeArguments?.()[1];
      const key = fromTsType(mapKeyType);
      const value = fromTsType(mapValueType);

      return Either.zipWith(key, value, (k, v) =>
          list(tuple([k, v])));

    case TypeKind.WeakMapDefinition:
      const weakMapKeyType = type.getTypeArguments?.()[0];
      const weakMapValueType = type.getTypeArguments?.()[1];
      const weakKey = fromTsType(weakMapKeyType);
      const weakValue = fromTsType(weakMapValueType);

      return Either.zipWith(
          weakKey,
          weakValue,
          (k, v) => list(tuple([k, v])
          ));

    case TypeKind.IteratorDefinition:
      const iteratorType = type.getTypeArguments?.()[0];

      if (!iteratorType) {
        return Either.left("Iterator must have a type argument");
      } else {
        return Either.map(fromTsType(iteratorType), (result) => list(result));
      }

    case TypeKind.IterableDefinition:
      const iterableType = type.getTypeArguments?.()[0];
      if (!iterableType) {
        return Either.left("Iterable must have a type argument");
      } else {
        return Either.map(fromTsType(iterableType), (result) => list(result));
      }

    case TypeKind.IterableIteratorDefinition:
      const iterableIteratorType = type.getTypeArguments?.()[0];
      if (!iterableIteratorType) {
        return Either.left("IterableIterator must have a type argument");
      } else {
        return Either.map(fromTsType(iterableIteratorType), (result) => list(result));
      }

    case TypeKind.Type: {
      const typeArgs = type.getTypeArguments?.() ?? [];

      const requireArgs = (n: number, msg: string) => {
        if (typeArgs.length !== n) {
          return Either.left(`Unable to handle the type ${type.id} ${type.name}. ${msg}`);
        }
        return null;
      };

      const handleSingleArg = (msg: string) => {
        const err = requireArgs(1, msg);
        if (err) return err;
        return fromTsType(typeArgs[0]);
      };

      if (type.isArray()) {
        const err = requireArgs(1, "Array must have a type argument");
        if (err) return err;
        return Either.map(
            fromTsType(typeArgs[0]),
            list
        );
      }

      if (type.isTuple()) {
        return Either.map(
            Either.all(typeArgs.map(fromTsType)),
            tuple
        );
      }

      if (type.isGenericType()) {
        const genericType = type as GenericType<typeof type>;
        const defName = genericType.genericTypeDefinition.name;

        if (defName === "Map") {
          const err = requireArgs(2, "Map must have two type arguments");
          if (err) return err;
          return Either.zipWith(
              fromTsType(typeArgs[0]),
              fromTsType(typeArgs[1]),
              (keyType, valueType) =>
                  list(tuple([keyType, valueType]))
          );
        }

        if (isInBuiltResult(type)) {
          const err = requireArgs(2, "Result type must have concrete type arguments");
          if (err) return err;
          return Either.zipWith(
              fromTsType(typeArgs[0]),
              fromTsType(typeArgs[1]),
              result
          );
        }

        return handleSingleArg(`The type id is ${genericType.id}.`);
      }

      return handleSingleArg(`The type id is ${type.id}.`);
    }

    case TypeKind.Object:
      const object = type as ObjectType;
      const props = object.getProperties();
      if (props.length === 0) {
        return Either.left(`Unsupported type for type ${type}`);
      }

      const objectFields = Either.all(props.map(prop =>
          Either.map(fromTsType(prop.type), (propType) =>
              field(prop.name.toString(), propType))
      ));

      return Either.map(objectFields, (fields) => record(fields))

    case TypeKind.Interface:
      const objectInterface = type as InterfaceType;
      const interfaceFields = Either.all(objectInterface.getProperties().map(prop => {
        const propertyAnalysedType = fromTsType(prop.type);

        if (prop.optional) {
          return Either.map(propertyAnalysedType, (result) =>
              field(prop.name.toString(), option(result))
          )
        } else {
          return Either.map(propertyAnalysedType, (result) =>
              field(prop.name.toString(), result)
          )
        }
      }));

      return Either.map(interfaceFields, (fields) => record(fields));

    case TypeKind.Union:
      let fieldIdx = 1;
      const unionType = type as UnionType;

      let foundBool = false;
      const possibleTypes: NameOptionTypePair[] = [];

      for (const t of unionType.types) {
        // To work around RTTIST bug where boolean fields in a union are split into true/false
        const isBoolLike =
            t.kind === TypeKind.Boolean ||
            t.kind === TypeKind.True ||
            t.kind === TypeKind.False;

        if (isBoolLike) {
          if (foundBool) continue;
          foundBool = true;
        }

        Either.map(fromTsType(t), (result) => {
          possibleTypes.push({
            name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
            typ: result,
          });
        });
      }

      return Either.right(variant(possibleTypes));

    case TypeKind.Alias:
      const typeAlias = type as TypeAliasType;
      return fromTsType(typeAlias.target)

    case TypeKind.Null:
      return Either.right(tuple([]))

    case TypeKind.BigInt:
      return Either.right(u64());

    case TypeKind.Float64Array:
      return Either.right(f64());

    case TypeKind.Number:
      return Either.right(s32()); // For the same reason - as an example - Rust defaults to i32

    case TypeKind.String:
      return Either.right(str());

    case TypeKind.RegExp:
      return Either.right(str());

    case TypeKind.Error:
      return Either.right(resultErr(str()));

    case TypeKind.Int8Array:
      return Either.right(list(s8()));

    case TypeKind.Uint8Array:
      return Either.right(list(u8()));

    case TypeKind.Uint8ClampedArray:
      return Either.right(list(u8()));

    case TypeKind.ArrayBuffer:
      return Either.right(list(u8()));

    case TypeKind.SharedArrayBuffer:
      return Either.right(list(u8()));

    case TypeKind.Int16Array:
      return Either.right(list(s16()));

    case TypeKind.Uint16Array:
      return Either.right(list(u16()));

    case TypeKind.Int32Array:
      return Either.right(list(s32()));

    case TypeKind.Uint32Array:
      return Either.right(list(u32()));

    case TypeKind.Float32Array:
      return Either.right(list(f32()));

    case TypeKind.BigInt64Array:
      return Either.right(list(s64()));

    case TypeKind.BigUint64Array:
      return Either.right(list(u64()));

    case TypeKind.NumberLiteral:
      return Either.right(f64());
    case TypeKind.BigIntLiteral:
      return Either.right(s64());
    case TypeKind.StringLiteral:
      return Either.right(str());

    case TypeKind.Promise:
      const promiseType = type.getTypeArguments?.()[0];

      if (!promiseType) {
        return Either.left("Promise must have a type argument");
      }

      return fromTsType(promiseType);

    case TypeKind.PromiseDefinition:
      const promiseDefType = type.getTypeArguments?.()[0];

      if (!promiseDefType) {
        return Either.left("PromiseDefinition must have a type argument");
      }

      return Either.map(fromTsType(promiseDefType), option);

    case TypeKind.ObjectType:
      const obj = type as ObjectType;
      const fields = Either.all(obj.getProperties().map(prop => {
        return Either.map(fromTsType(prop.type), (result) => field(prop.name.toString(), result));
      }));

      return Either.map(fields, record);

    case TypeKind.TupleDefinition:
      const tupleTypes =
          Either.all(type.getTypeArguments?.().map(fromTsType)) || Either.all([]);

      return Either.map(tupleTypes, tuple);

    case TypeKind.ArrayDefinition:
      const arrayType = type.getTypeArguments?.()[0];

      if (!arrayType) {
        return Either.left("Array must have a type argument");
      }
      return Either.map(fromTsType(arrayType), list)

    case TypeKind.ReadonlyArrayDefinition:
      const elementType = type.getTypeArguments?.()[0];

      if (!elementType) {
        return Either.left("Array must have a type argument");
      }
      return Either.map(fromTsType(elementType), list)

    default:
      return Either.left(`The following type is not supported as argument or return type in agentic context ${type.displayName}`);
  }
}
