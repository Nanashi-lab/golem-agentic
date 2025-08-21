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

import { WitNode, WitValue } from 'golem:rpc/types@0.2.2';
import {
  GenericType,
  InterfaceType,
  ObjectType,
  PromiseType,
  PropertyInfo,
  Type,
  TypeAliasType,
  TypeKind,
  UnionType,
} from 'rttist';
import { isInBuiltResult } from '../types/inbuilt';
import * as Either from 'effect/Either';
import * as Option from 'effect/Option';

export type Value =
  | { kind: 'bool'; value: boolean }
  | { kind: 'u8'; value: number }
  | { kind: 'u16'; value: number }
  | { kind: 'u32'; value: number }
  | { kind: 'u64'; value: bigint }
  | { kind: 's8'; value: number }
  | { kind: 's16'; value: number }
  | { kind: 's32'; value: number }
  | { kind: 's64'; value: bigint }
  | { kind: 'f32'; value: number }
  | { kind: 'f64'; value: number }
  | { kind: 'char'; value: string }
  | { kind: 'string'; value: string }
  | { kind: 'list'; value: Value[] }
  | { kind: 'tuple'; value: Value[] }
  | { kind: 'record'; value: Value[] }
  | { kind: 'variant'; caseIdx: number; caseValue?: Value }
  | { kind: 'enum'; value: number }
  | { kind: 'flags'; value: boolean[] }
  | { kind: 'option'; value?: Value }
  | { kind: 'result'; value: { ok?: Value; err?: Value } }
  | { kind: 'handle'; uri: string; resourceId: bigint };

export function fromWitValue(wit: WitValue): Value {
  if (!wit.nodes.length) throw new Error('Empty nodes in WitValue');

  return buildTree(wit.nodes[wit.nodes.length - 1], wit.nodes);
}

function buildTree(node: WitNode, nodes: WitNode[]): Value {
  switch (node.tag) {
    case 'record-value':
      return {
        kind: 'record',
        value: node.val.map((idx) => buildTree(nodes[idx], nodes)),
      };

    case 'variant-value': {
      const [caseIdx, maybeIndex] = node.val;
      if (maybeIndex !== undefined) {
        return {
          kind: 'variant',
          caseIdx,
          caseValue: buildTree(nodes[maybeIndex], nodes),
        };
      } else {
        return {
          kind: 'variant',
          caseIdx,
          caseValue: undefined,
        };
      }
    }

    case 'enum-value':
      return { kind: 'enum', value: node.val };

    case 'flags-value':
      return { kind: 'flags', value: node.val };

    case 'tuple-value':
      return {
        kind: 'tuple',
        value: node.val.map((idx) => buildTree(nodes[idx], nodes)),
      };

    case 'list-value':
      return {
        kind: 'list',
        value: node.val.map((idx) => buildTree(nodes[idx], nodes)),
      };

    case 'option-value':
      if (node.val === undefined) {
        return { kind: 'option', value: undefined };
      }
      return {
        kind: 'option',
        value: buildTree(nodes[node.val], nodes),
      };

    case 'result-value': {
      const res = node.val;
      if (res.tag === 'ok') {
        return {
          kind: 'result',
          value: {
            ok:
              res.val !== undefined
                ? buildTree(nodes[res.val], nodes)
                : undefined,
          },
        };
      } else {
        return {
          kind: 'result',
          value: {
            err:
              res.val !== undefined
                ? buildTree(nodes[res.val], nodes)
                : undefined,
          },
        };
      }
    }

    case 'prim-u8':
      return { kind: 'u8', value: node.val };
    case 'prim-u16':
      return { kind: 'u16', value: node.val };
    case 'prim-u32':
      return { kind: 'u32', value: node.val };
    case 'prim-u64':
      return { kind: 'u64', value: node.val };
    case 'prim-s8':
      return { kind: 's8', value: node.val };
    case 'prim-s16':
      return { kind: 's16', value: node.val };
    case 'prim-s32':
      return { kind: 's32', value: node.val };
    case 'prim-s64':
      return { kind: 's64', value: node.val };
    case 'prim-float32':
      return { kind: 'f32', value: node.val };
    case 'prim-float64':
      return { kind: 'f64', value: node.val };
    case 'prim-char':
      return { kind: 'char', value: node.val };
    case 'prim-bool':
      return { kind: 'bool', value: node.val };
    case 'prim-string':
      return { kind: 'string', value: node.val };

    case 'handle': {
      const [uri, resourceId] = node.val;
      return {
        kind: 'handle',
        uri: uri.value,
        resourceId,
      };
    }

    default:
      throw new Error(`Unhandled tag: ${(node as any).tag}`);
  }
}

export function toWitValue(value: Value): WitValue {
  const nodes: WitNode[] = [];
  buildNodes(value, nodes);
  return { nodes: nodes };
}

function buildNodes(value: Value, nodes: WitNode[]): number {
  const push = (node: WitNode): number => {
    nodes.push(node);
    return nodes.length - 1;
  };

  switch (value.kind) {
    case 'record':
      const recordIndices = value.value.map((v) => buildNodes(v, nodes));
      return push({ tag: 'record-value', val: recordIndices });

    case 'variant':
      return push({
        tag: 'variant-value',
        val:
          value.caseValue !== undefined
            ? [value.caseIdx, buildNodes(value.caseValue, nodes)]
            : [value.caseIdx, undefined],
      });

    case 'enum':
      return push({ tag: 'enum-value', val: value.value });

    case 'flags':
      return push({ tag: 'flags-value', val: value.value });

    case 'tuple':
      const tupleIndices = value.value.map((v) => buildNodes(v, nodes));
      return push({ tag: 'tuple-value', val: tupleIndices });

    case 'list':
      const listIndices = value.value.map((v) => buildNodes(v, nodes));
      return push({ tag: 'list-value', val: listIndices });

    case 'option':
      return push({
        tag: 'option-value',
        val:
          value.value !== undefined
            ? buildNodes(value.value, nodes)
            : undefined,
      });

    case 'result':
      if ('ok' in value.value) {
        return push({
          tag: 'result-value',
          val: {
            tag: 'ok',
            val:
              value.value.ok !== undefined
                ? buildNodes(value.value.ok, nodes)
                : undefined,
          },
        });
      } else {
        return push({
          tag: 'result-value',
          val: {
            tag: 'err',
            val:
              value.value.err !== undefined
                ? buildNodes(value.value.err, nodes)
                : undefined,
          },
        });
      }

    case 'u8':
      return push({ tag: 'prim-u8', val: value.value });
    case 'u16':
      return push({ tag: 'prim-u16', val: value.value });
    case 'u32':
      return push({ tag: 'prim-u32', val: value.value });
    case 'u64':
      return push({ tag: 'prim-u64', val: value.value });
    case 's8':
      return push({ tag: 'prim-s8', val: value.value });
    case 's16':
      return push({ tag: 'prim-s16', val: value.value });
    case 's32':
      return push({ tag: 'prim-s32', val: value.value });
    case 's64':
      return push({ tag: 'prim-s64', val: value.value });
    case 'f32':
      return push({ tag: 'prim-float32', val: value.value });
    case 'f64':
      return push({ tag: 'prim-float64', val: value.value });
    case 'char':
      return push({ tag: 'prim-char', val: value.value });
    case 'bool':
      return push({ tag: 'prim-bool', val: value.value });
    case 'string':
      return push({ tag: 'prim-string', val: value.value });

    case 'handle':
      return push({
        tag: 'handle',
        val: [{ value: value.uri }, value.resourceId],
      });

    default:
      throw new Error(`Unhandled kind: ${(value as any).kind}`);
  }
}

// Note that we take `type: Type` instead of `type: AnalysedType`(because at this point `AnalysedType` of the `tsValue` is also available)
// as `Type` holds more information, and can be used to determine the error messages for wrong `tsValue` more accurately.
export function fromTsValue(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  switch (type.kind) {
    case TypeKind.Null:
      return Either.right({ kind: 'tuple', value: [] });

    case TypeKind.Boolean:
      return handleBooleanType(tsValue);

    case TypeKind.False:
      return handleBooleanType(tsValue);

    case TypeKind.True:
      return handleBooleanType(tsValue);

    case TypeKind.Number:
      if (typeof tsValue === 'number') {
        return Either.right({ kind: 's32', value: tsValue });
      } else {
        return Either.left(invalidTypeError(tsValue, 'number'));
      }

    case TypeKind.BigInt:
      if (typeof tsValue === 'bigint' || typeof tsValue === 'number') {
        return Either.right({ kind: 'u64', value: tsValue as any });
      } else {
        return Either.left(invalidTypeError(tsValue, 'bigint'));
      }

    case TypeKind.String:
      if (typeof tsValue === 'string') {
        return Either.right({ kind: 'string', value: tsValue });
      } else {
        return Either.left(invalidTypeError(tsValue, 'string'));
      }

    case TypeKind.PromiseDefinition:
      const promiseDefType = type as PromiseType;
      const promiseDefArgType = promiseDefType.getTypeArguments()[0];
      return fromTsValue(tsValue, promiseDefArgType);

    case TypeKind.Interface:
      return handleObject(tsValue, type);

    case TypeKind.Union: {
      return handleUnion(tsValue, type);
    }

    case TypeKind.Alias:
      const aliasType = type as TypeAliasType;
      const targetType = aliasType.target;
      return fromTsValue(tsValue, targetType);

    case TypeKind.Promise:
      const promiseType = type as PromiseType;
      const argument = promiseType.getTypeArguments()[0];
      return fromTsValue(tsValue, argument);

    case TypeKind.Type:
      return handleGeneralType(tsValue, type);

    case TypeKind.ObjectType:
      return handleObject(tsValue, type);

    case TypeKind.Uint8ClampedArray:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 'u8', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Uint8ClampedArray'));
      }

    case TypeKind.Int8Array:
      const int8Array = handleTypedArray(tsValue, Int8Array);

      return Either.map(int8Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's8',
          value: item,
        })),
      }));

    case TypeKind.Int16Array:
      const int16Array = handleTypedArray(tsValue, Int16Array);

      return Either.map(int16Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's16',
          value: item,
        })),
      }));

    case TypeKind.Int32Array:
      const int32Array = handleTypedArray(tsValue, Int32Array);

      return Either.map(int32Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's32',
          value: item,
        })),
      }));

    case TypeKind.BigInt64Array:
      const int64Array = handleTypedArray(tsValue, BigInt64Array);

      return Either.map(int64Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's64',
          value: item,
        })),
      }));

    case TypeKind.Uint8Array:
      const uint8Array = handleTypedArray(tsValue, Uint8Array);

      return Either.map(uint8Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u8',
          value: item,
        })),
      }));

    case TypeKind.Uint16Array:
      const uint16Array = handleTypedArray(tsValue, Uint16Array);

      return Either.map(uint16Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u16',
          value: item,
        })),
      }));

    case TypeKind.Uint32Array:
      const uint32Array = handleTypedArray(tsValue, Uint32Array);

      return Either.map(uint32Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u32',
          value: item,
        })),
      }));

    case TypeKind.BigUint64Array:
      const uint64Array = handleTypedArray(tsValue, BigUint64Array);

      return Either.map(uint64Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u64',
          value: item,
        })),
      }));

    case TypeKind.Float32Array:
      const float32Array = handleTypedArray(tsValue, Float32Array);

      return Either.map(float32Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'f32',
          value: item,
        })),
      }));

    case TypeKind.Float64Array:
      const float64Array = handleTypedArray(tsValue, Float64Array);

      return Either.map(float64Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'f32',
          value: item,
        })),
      }));

    case TypeKind.Object:
      return handleObject(tsValue, type);

    case TypeKind.StringLiteral:
      if (typeof tsValue === 'string') {
        return Either.right({ kind: 'string', value: tsValue });
      } else {
        return Either.left(invalidTypeError(tsValue, 'string literal'));
      }
    default:
      return Either.left(unexpectedTypeError(tsValue, type, Option.none()));
  }
}

function handleTypedArray<
  A extends
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | BigUint64Array
    | Int8Array
    | Int16Array
    | Int32Array
    | BigInt64Array
    | Float32Array
    | Float64Array,
>(tsValue: unknown, ctor: { new (_: number): A }): Either.Either<A, string> {
  return tsValue instanceof ctor
    ? Either.right(tsValue)
    : Either.left(invalidTypeError(tsValue, ctor.name));
}

function handleBooleanType(tsValue: any): Either.Either<Value, string> {
  if (typeof tsValue === 'boolean') {
    return Either.right({ kind: 'bool', value: tsValue });
  } else {
    return Either.left(invalidTypeError(tsValue, 'boolean'));
  }
}

function handleGeneralType(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  if (type.isArray()) return handleArrayType(tsValue, type);
  if (type.isTuple()) return handleTupleType(tsValue, type);
  if (type.isGenericType()) return handleOtherComplexTypes(tsValue, type);

  return Either.left(
    unexpectedTypeError(
      tsValue,
      type,
      Option.some(`Unsupported TypeKind.Type: ${type.displayName}`),
    ),
  );
}

function handleArrayType(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  const typeArg = type.getTypeArguments?.()[0];
  if (!typeArg) {
    return Either.left(
      unexpectedTypeError(
        tsValue,
        type,
        Option.some('unable to infer the type of Array'),
      ),
    );
  }
  if (!Array.isArray(tsValue)) {
    return Either.left(invalidTypeError(tsValue, 'array'));
  }

  return Either.map(
    Either.all(tsValue.map((item) => fromTsValue(item, typeArg))),
    (values) => ({ kind: 'list', value: values }),
  );
}

function handleTupleType(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  const typeArgs = type.getTypeArguments?.();
  if (!Array.isArray(tsValue)) {
    return Either.left(invalidTypeError(tsValue, 'tuple'));
  }

  return Either.map(
    Either.all(tsValue.map((item, idx) => fromTsValue(item, typeArgs[idx]))),
    (values) => ({ kind: 'tuple', value: values }),
  );
}

function handleOtherComplexTypes(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  const genericType = type as GenericType<typeof type>;
  const name = genericType.genericTypeDefinition.name;

  if (name === 'Map') return handleKeyValuePairs(tsValue, type);

  if (isInBuiltResult(type)) return handleInBuiltResult(tsValue, type);

  if (name === 'Promise') return handlePromiseType(tsValue, type);

  return Either.left(
    unexpectedTypeError(
      tsValue,
      type,
      Option.some(`Unsupported generic type: ${name}`),
    ),
  );
}

function handlePromiseType(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  const typeArgs = type.getTypeArguments?.();

  if (!typeArgs || typeArgs.length !== 1) {
    return Either.left(
      unexpectedTypeError(
        tsValue,
        type,
        Option.some(`${type.name} must have one type argument`),
      ),
    );
  }

  const innerType = typeArgs[0];
  return fromTsValue(tsValue, innerType);
}

function handleResultType(
  tsValue: any,
  okType: Type,
  errorType: Type,
): Either.Either<Value, string> {
  if (
    typeof tsValue === 'object' &&
    tsValue !== null &&
    'tag' in tsValue &&
    'val' in tsValue
  ) {
    if (tsValue.tag === 'ok') {
      const okTsVal = tsValue.val;

      const okValue = fromTsValue(okTsVal, okType);

      return Either.map(okValue, (okValue) => {
        return {
          kind: 'result',
          value: {
            ok: okValue,
          },
        };
      });
    } else if (tsValue.tag === 'err') {
      const errTsVal = tsValue.val;

      const errValue = fromTsValue(errTsVal, errorType);

      return Either.map(errValue, (errValue) => {
        return {
          kind: 'result',
          value: {
            err: errValue,
          },
        };
      });
    } else {
      return Either.left(invalidTypeError(tsValue, 'result'));
    }
  } else {
    return Either.left(invalidTypeError(tsValue, 'result'));
  }
}

function handleInBuiltResult(
  tsValue: any,
  genericType: Type,
): Either.Either<Value, string> {
  const okType = genericType.getTypeArguments?.()[0];
  const errorType = genericType.getTypeArguments?.()[1];

  if (!okType || !errorType) {
    return Either.left(
      unexpectedTypeError(
        tsValue,
        genericType,
        Option.some('Result must have two type arguments'),
      ),
    );
  }
  return handleResultType(tsValue, okType, errorType);
}

function handleKeyValuePairs(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  const typeArgs = type.getTypeArguments?.();
  if (!typeArgs || typeArgs.length !== 2) {
    return Either.left(
      unexpectedTypeError(
        tsValue,
        type,
        Option.some('Map must have two type arguments'),
      ),
    );
  }
  if (!(tsValue instanceof Map)) {
    return Either.left(invalidTypeError(tsValue, 'Map'));
  }

  const [keyType, valueType] = typeArgs;
  if (!keyType || !valueType) {
    return Either.left(
      unexpectedTypeError(
        tsValue,
        type,
        Option.some('unable to infer key or value type'),
      ),
    );
  }

  const values = Either.all(
    Array.from(tsValue.entries()).map(([key, value]) =>
      Either.zipWith(
        fromTsValue(key, keyType),
        fromTsValue(value, valueType),
        (k, v) => ({ kind: 'tuple', value: [k, v] }) as Value,
      ),
    ),
  );

  return Either.map(values, (value) => ({ kind: 'list', value }));
}

function handleObject(tsValue: any, type: Type): Either.Either<Value, string> {
  if (typeof tsValue !== 'object' || tsValue === null) {
    return Either.left(invalidTypeError('object', tsValue));
  }

  const innerType = type as ObjectType;
  const innerProperties = innerType.getProperties();
  const values: Value[] = [];

  for (const prop of innerProperties) {
    const key = prop.name.toString();

    if (!Object.prototype.hasOwnProperty.call(tsValue, key)) {
      if (prop.optional) {
        values.push({ kind: 'option' });
      } else if (prop.type.isString() && tsValue === '') {
        values.push({ kind: 'string', value: '' });
      } else if (prop.type.isNumber() && tsValue === 0) {
        values.push({ kind: 's32', value: 0 });
      } else if (prop.type.isBoolean() && tsValue === false) {
        values.push({ kind: 'bool', value: false });
      } else {
        return Either.left(missingValueForKey(key, tsValue));
      }
      continue;
    }

    const fieldVal = fromTsValue(tsValue[key], prop.type);

    if (Either.isLeft(fieldVal)) {
      return Either.left(fieldVal.left);
    }

    values.push(fieldVal.right);
  }

  return Either.right({ kind: 'record', value: values });
}

function handleUnion(tsValue: any, type: Type): Either.Either<Value, string> {
  const unionType = type as UnionType;
  const possibleTypes = unionType.types;
  const typeWithIndex = findTypeOfAny(tsValue, possibleTypes);

  if (!typeWithIndex) {
    return Either.left(unionTypeMatchError(tsValue, possibleTypes));
  } else {
    const innerType = typeWithIndex[0];

    return Either.map(fromTsValue(tsValue, innerType), (result) => {
      return {
        kind: 'variant',
        caseIdx: typeWithIndex[1],
        caseValue: result,
      };
    });
  }
}

function findTypeOfAny(
  value: any,
  typeList: readonly Type[],
): [Type, number] | undefined {
  for (let idx = 0; idx < typeList.length; idx++) {
    const type = typeList[idx];
    if (matchesType(value, type)) {
      return [type, idx];
    }
  }
  return undefined;
}

function matchesType(value: any, type: Type): boolean {
  switch (type.kind) {
    case TypeKind.Number:
      return typeof value === 'number';

    case TypeKind.String:
      return typeof value === 'string';

    case TypeKind.Boolean:
    case TypeKind.True:
    case TypeKind.False:
      return typeof value === 'boolean';

    case TypeKind.Null:
      return value === null;

    case TypeKind.Undefined:
      return value === undefined;

    case TypeKind.Any:
      return true;

    case TypeKind.Type:
      return matchesComplexType(value, type);

    case TypeKind.ArrayBuffer:
      return matchesArray(value, type.getTypeArguments?.()[0]);

    case TypeKind.TupleDefinition:
      return matchesTuple(value, type.getTypeArguments());

    case TypeKind.ObjectType:
    case TypeKind.Interface:
    case TypeKind.Object:
    case TypeKind.NonPrimitiveObject:
      return handleObjectMatch(value, type);

    case TypeKind.Alias:
      return matchesType(value, (type as TypeAliasType).target);

    case TypeKind.Union:
      return (type as UnionType).types.some((t) => matchesType(value, t));

    default:
      return false;
  }
}

function matchesComplexType(value: any, type: Type): boolean {
  if (type.isArray()) {
    const elemType = type.getTypeArguments?.()[0];
    return matchesArray(value, elemType);
  }

  if (type.isTuple()) {
    return matchesTuple(value, type.getTypeArguments?.());
  }

  if (type.isGenericType()) {
    const genericType = type as GenericType<typeof type>;
    const genericName = genericType.genericTypeDefinition.name;

    if (genericName === 'Map') {
      const [keyType, valType] = type.getTypeArguments?.() ?? [];
      if (!keyType || !valType) {
        return false;
      }
      if (!(value instanceof Map)) return false;

      return Array.from(value.entries()).every(
        ([k, v]) => matchesType(k, keyType) && matchesType(v, valType),
      );
    }

    if (isInBuiltResult(type)) {
      const okType = genericType.getTypeArguments?.()[0];
      const errorType = genericType.getTypeArguments?.()[1];

      if (!okType || !errorType) {
        return false;
      }

      if (typeof value !== 'object' || value === null) return false;

      if ('tag' in value && 'val' in value) {
        if (value.tag === 'ok') {
          return matchesType(value.val, okType);
        } else if (value.tag === 'err') {
          return matchesType(value.val, errorType);
        }
      }
      return false;
    }

    return false;
  }

  return false;
}

function matchesTuple(
  value: any,
  tupleTypes: readonly Type[] | undefined,
): boolean {
  if (!Array.isArray(value)) return false;
  if (!tupleTypes) return false;
  if (value.length !== tupleTypes.length) return false;

  return value.every((v, idx) => matchesType(v, tupleTypes[idx]));
}

function matchesArray(value: any, elementType: Type | undefined): boolean {
  if (!Array.isArray(value)) return false;
  if (!elementType) return true;
  return value.every((item) => matchesType(item, elementType));
}

function handleObjectMatch(value: any, type: Type): boolean {
  if (typeof value !== 'object' || value === null) return false;

  const objectType = type as ObjectType;
  const props = objectType.getProperties() ?? [];

  // Allow extra keys? If no, strict check:
  const valueKeys = Object.keys(value);
  if (valueKeys.length !== props.length) return false;

  for (const prop of props) {
    const key = prop.name.toString();
    const hasKey = key in value;

    if (!hasKey) {
      if (!prop.optional) return false;
      // Optional property missing: OK
    } else {
      if (!matchesType(value[key], prop.type)) return false;
    }
  }

  return true;
}

function invalidTypeError(tsValue: any, expectedType: string): string {
  return `Expected ${expectedType}, but got ${tsValue} which is of type ${typeof tsValue}`;
}

function missingValueForKey(key: string, tsValue: any): string {
  return `Missing property '${key}' in ${tsValue}`;
}

function unionTypeMatchError(unionTypes: Type[], tsValue: any): string {
  return `Value '${tsValue}' does not match any of the union types: ${unionTypes.map((t) => t.name).join(', ')}`;
}

function unexpectedTypeError(
  tsValue: any,
  expectedType: Type,
  message: Option.Option<string>,
): string {
  const error = `Value ${JSON.stringify(tsValue)} cannot be handled. Type of this value is inferred to be ${expectedType.name}`;
  return error + (Option.isSome(message) ? ` Reason: ${message.value}` : '');
}

export function toTsValue(value: Value, expectedType: Type): any {
  if (value === undefined) {
    return null;
  }

  // There is no option type in type-script, so take analysed type along with expected type.
  if (value.kind === 'option') {
    if (!value.value) {
      return null;
    } else {
      return toTsValue(value.value, expectedType);
    }
  }

  switch (expectedType.kind) {
    case TypeKind.Null:
      return null;

    case TypeKind.Boolean:
      if (value.kind === 'bool') {
        return value.value;
      } else {
        throw new Error(`Expected boolean, obtained value ${value}`);
      }
    case TypeKind.False:
      if (value.kind === 'bool') {
        return value.value;
      } else {
        throw new Error(`Expected boolean, obtained value ${value}`);
      }
    case TypeKind.True:
      if (value.kind === 'bool') {
        return value.value;
      } else {
        throw new Error(`Expected boolean, obtained value ${value}`);
      }
    case TypeKind.Number:
      if (
        value.kind === 'f64' ||
        value.kind === 'u8' ||
        value.kind === 'u16' ||
        value.kind === 'u32' ||
        value.kind === 'u64' ||
        value.kind === 's8' ||
        value.kind === 's16' ||
        value.kind === 's32' ||
        value.kind === 's64' ||
        value.kind === 'f32'
      ) {
        return value.value;
      } else {
        throw new Error(`Expected number, obtained value ${value}`);
      }
    case TypeKind.BigInt:
      if (value.kind === 'u64' || value.kind === 's64') {
        return value.value;
      } else {
        throw new Error(`Expected bigint, obtained value ${value}`);
      }
    case TypeKind.String:
      if (value.kind === 'string') {
        return value.value;
      } else {
        throw new Error(`Expected string, obtained value ${value}`);
      }
    case TypeKind.NonPrimitiveObject:
      if (value.kind === 'record') {
        const fieldValues = value.value;
        const expectedTypeFields: ReadonlyArray<PropertyInfo> = (
          expectedType as ObjectType
        ).getProperties();
        return expectedTypeFields.reduce(
          (acc, field, idx) => {
            const name: string = field.name.toString();
            const expectedFieldType = field.type;
            acc[name] = toTsValue(fieldValues[idx], expectedFieldType);
            return acc;
          },
          {} as Record<string, any>,
        );
      } else {
        throw new Error(`Expected object, obtained value ${value}`);
      }
    case TypeKind.ObjectType:
      if (value.kind === 'record') {
        const fieldValues = value.value;
        const expectedTypeFields: ReadonlyArray<PropertyInfo> = (
          expectedType as ObjectType
        ).getProperties();
        return expectedTypeFields.reduce(
          (acc, field, idx) => {
            const name: string = field.name.toString();
            const expectedFieldType = field.type;
            acc[name] = toTsValue(fieldValues[idx], expectedFieldType);
            return acc;
          },
          {} as Record<string, any>,
        );
      } else {
        throw new Error(`Expected object, obtained value ${value}`);
      }
    case TypeKind.Date:
      if (value.kind === 'string') {
        return new Date(value.value);
      } else {
        throw new Error(`Expected date, obtained value ${value}`);
      }
    case TypeKind.Error:
      if (value.kind === 'result') {
        if (value.value.err !== undefined) {
          if (value.value.err.kind === 'string') {
            return new Error(value.value.err.value);
          } else {
            throw new Error(
              `Expected error string, obtained value ${value.value.err}`,
            );
          }
        } else {
          throw new Error(`Expected error, obtained value ${value}`);
        }
      } else {
        throw new Error(`Expected error, obtained value ${value}`);
      }
    case TypeKind.RegExp:
      if (value.kind === 'string') {
        return new RegExp(value.value);
      } else {
        throw new Error(`Expected RegExp, obtained value ${value}`);
      }
    case TypeKind.Int8Array:
      if (value.kind === 'list') {
        return new Int8Array(value.value.map((v) => toTsValue(v, Type.Number)));
      } else {
        throw new Error(`Expected Int8Array, obtained value ${value}`);
      }
    case TypeKind.Uint8Array:
      if (value.kind === 'list') {
        return new Uint8Array(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint8Array, obtained value ${value}`);
      }
    case TypeKind.Uint8ClampedArray:
      if (value.kind === 'list') {
        return new Uint8ClampedArray(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint8ClampedArray, obtained value ${value}`);
      }
    case TypeKind.Int16Array:
      if (value.kind === 'list') {
        return new Int16Array(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Int16Array, obtained value ${value}`);
      }
    case TypeKind.Uint16Array:
      if (value.kind === 'list') {
        return new Uint16Array(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint16Array, obtained value ${value}`);
      }
    case TypeKind.Int32Array:
      if (value.kind === 'list') {
        return new Int32Array(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Int32Array, obtained value ${value}`);
      }
    case TypeKind.Uint32Array:
      if (value.kind === 'list') {
        return new Uint32Array(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint32Array, obtained value ${value}`);
      }
    case TypeKind.Float32Array:
      if (value.kind === 'list') {
        return new Float32Array(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Float32Array, obtained value ${value}`);
      }
    case TypeKind.Float64Array:
      if (value.kind === 'list') {
        return new Float64Array(
          value.value.map((v) => toTsValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Float64Array, obtained value ${value}`);
      }
    case TypeKind.BigInt64Array:
      if (value.kind === 'list') {
        return new BigInt64Array(
          value.value.map((v) => toTsValue(v, Type.BigInt)),
        );
      } else {
        throw new Error(`Expected BigInt64Array, obtained value ${value}`);
      }
    case TypeKind.BigUint64Array:
      if (value.kind === 'list') {
        return new BigUint64Array(
          value.value.map((v) => toTsValue(v, Type.BigInt)),
        );
      } else {
        throw new Error(`Expected BigUint64Array, obtained value ${value}`);
      }
    case TypeKind.ArrayBuffer:
      if (value.kind === 'list') {
        const byteArray = value.value.map((v) => {
          const convertedValue = toTsValue(v, Type.Number);
          if (typeof convertedValue !== 'number') {
            throw new Error(
              `Expected number, obtained value ${convertedValue}`,
            );
          }
          return convertedValue;
        });
        return new Uint8Array(byteArray).buffer;
      } else {
        throw new Error(`Expected ArrayBuffer, obtained value ${value}`);
      }
    case TypeKind.SharedArrayBuffer:
      if (value.kind === 'list') {
        const byteArray = value.value.map((v) => {
          const convertedValue = toTsValue(v, Type.Number);
          if (typeof convertedValue !== 'number') {
            throw new Error(
              `Expected number, obtained value ${convertedValue}`,
            );
          }
          return convertedValue;
        });
        return new Uint8Array(byteArray).buffer;
      } else {
        throw new Error(`Expected SharedArrayBuffer, obtained value ${value}`);
      }
    case TypeKind.DataView:
      if (value.kind === 'list') {
        const byteArray = value.value.map((v) => {
          const convertedValue = toTsValue(v, Type.Number);
          if (typeof convertedValue !== 'number') {
            throw new Error(
              `Expected number, obtained value ${convertedValue}`,
            );
          }
          return convertedValue;
        });
        return new DataView(new Uint8Array(byteArray).buffer);
      } else {
        throw new Error(`Expected DataView, obtained value ${value}`);
      }
    case TypeKind.Object:
      if (value.kind === 'record') {
        const fieldValues = value.value;
        const expectedTypeFields: ReadonlyArray<PropertyInfo> = (
          expectedType as ObjectType
        ).getProperties();
        return expectedTypeFields.reduce(
          (acc, field, idx) => {
            const name: string = field.name.toString();
            const expectedFieldType = field.type;
            const tsValue = toTsValue(fieldValues[idx], expectedFieldType);
            if (field.optional && (tsValue === undefined || tsValue === null)) {
              return acc;
            } else {
              acc[name] = tsValue;
              return acc;
            }
          },
          {} as Record<string, any>,
        );
      } else {
        throw new Error(`Expected object, obtained value ${value}`);
      }
    case TypeKind.Interface:
      if (value.kind === 'record') {
        const fieldValues = value.value;
        const expectedTypeFields: ReadonlyArray<PropertyInfo> = (
          expectedType as InterfaceType
        ).getProperties();
        return expectedTypeFields.reduce(
          (acc, field, idx) => {
            const name: string = field.name.toString();
            const expectedFieldType = field.type;
            const tsValue = toTsValue(fieldValues[idx], expectedFieldType);
            if (field.optional && (tsValue === undefined || tsValue === null)) {
              return acc;
            } else {
              acc[name] = tsValue;
              return acc;
            }
          },
          {} as Record<string, any>,
        );
      } else {
        throw new Error(`Expected object, obtained value ${value}`);
      }
    case TypeKind.Undefined:
      return null;
    case TypeKind.Union:
      if (value.kind === 'variant') {
        const caseValue = value.caseValue;
        if (!caseValue) {
          throw new Error(`Expected value, obtained value ${value}`);
        }

        const unionTypes = (expectedType as UnionType).types;
        const matchingType = unionTypes[value.caseIdx];

        return toTsValue(caseValue, matchingType);
      } else {
        throw new Error(`Expected union, obtained value ${value}`);
      }
    case TypeKind.Alias:
      const aliasType = expectedType as TypeAliasType;
      const targetType = aliasType.target;
      return toTsValue(value, targetType);
    case TypeKind.StringLiteral:
      if (value.kind === 'string') {
        return value.value;
      } else {
        throw new Error(`Unrecognized value for ${value.kind}`);
      }
    case TypeKind.Promise:
      const innerType = (expectedType as PromiseType).getTypeArguments()[0];
      return toTsValue(value, innerType);
    case TypeKind.Type:
      if (expectedType.isArray()) {
        if (value.kind === 'list') {
          return value.value.map((item: Value) =>
            toTsValue(item, expectedType.getTypeArguments?.()[0]),
          );
        } else {
          throw new Error(`Expected array, obtained value ${value}`);
        }
      } else if (expectedType.isTuple()) {
        const typeArg = expectedType.getTypeArguments?.();
        if (value.kind === 'tuple') {
          return value.value.map((item: Value, idx: number) =>
            toTsValue(item, typeArg[idx]),
          );
        } else {
          throw new Error(`Expected tuple, obtained value ${value}`);
        }
      } else if (expectedType.isGenericType()) {
        const genericType: GenericType<typeof expectedType> =
          expectedType as GenericType<typeof expectedType>;
        const genericTypeDefinition = genericType.genericTypeDefinition;
        if (genericTypeDefinition.name === 'Map') {
          const typeArgs = expectedType.getTypeArguments?.();

          if (!typeArgs || typeArgs.length !== 2) {
            throw new Error('Map must have two type arguments');
          }

          if (value.kind === 'list') {
            const entries: [any, any][] = value.value.map((item: Value) => {
              if (item.kind !== 'tuple' || item.value.length !== 2) {
                throw new Error(
                  `Expected tuple of two items, obtained value ${item}`,
                );
              }

              return [
                toTsValue(item.value[0], typeArgs[0]),
                toTsValue(item.value[1], typeArgs[1]),
              ] as [any, any];
            });
            return new Map(entries);
          } else {
            throw new Error(`Expected Map, obtained value ${value}`);
          }
        } else if (isInBuiltResult(expectedType)) {
          if (value.kind === 'result') {
            const resultValue = value.value;

            const typeArgs = expectedType.getTypeArguments?.();
            if (!typeArgs || typeArgs.length !== 2) {
              throw new Error('Result type must have two type arguments');
            }

            if (resultValue.ok !== undefined) {
              const okType = typeArgs[0];
              const resulValue = resultValue.ok;
              const tsValue = toTsValue(resulValue, okType);
              return {
                tag: 'ok',
                val: tsValue,
              };
            } else if (resultValue.err !== undefined) {
              const errType = typeArgs[1];
              const resulValue = resultValue.err;
              const tsValue = toTsValue(resulValue, errType);
              return {
                tag: 'err',
                val: tsValue,
              };
            } else {
              throw new Error(
                `Expected result with ok or err, obtained value ${value}`,
              );
            }
          }
        } else if (genericTypeDefinition.name === 'Promise') {
          const typeArgs = expectedType.getTypeArguments?.();
          if (!typeArgs || typeArgs.length !== 1) {
            throw new Error('Promise type must have one type argument');
          }

          return toTsValue(value, typeArgs[0]);
        } else {
          throw new Error(
            `Generic type ${genericTypeDefinition.name} not supported`,
          );
        }
      } else {
        const arg = expectedType.getTypeArguments?.()[0];
        if (!arg) {
          throw new Error('Type must have a type argument');
        }
        return toTsValue(value, arg);
      }

    default:
      throw new Error(
        `'${expectedType.displayName} with kind ${expectedType.kind} not supported'`,
      );
  }
}
