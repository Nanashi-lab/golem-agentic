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

import { Type, Symbol, Node } from '@golemcloud/golem-ts-types-core';
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
  const name = type.getName();

  switch (name) {
    case 'Int8Array':
      const int8Array = handleTypedArray(tsValue, Int8Array);

      return Either.map(int8Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's8',
          value: item,
        })),
      }));

    case 'Int16Array':
      const int16Array = handleTypedArray(tsValue, Int16Array);

      return Either.map(int16Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's16',
          value: item,
        })),
      }));

    case 'Int32Array':
      const int32Array = handleTypedArray(tsValue, Int32Array);

      return Either.map(int32Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's32',
          value: item,
        })),
      }));

    case 'BigInt64Array':
      const int64Array = handleTypedArray(tsValue, BigInt64Array);

      return Either.map(int64Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 's64',
          value: item,
        })),
      }));

    case 'Uint8Array':
      const uint8Array = handleTypedArray(tsValue, Uint8Array);

      return Either.map(uint8Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u8',
          value: item,
        })),
      }));

    case 'Uint16Array':
      const uint16Array = handleTypedArray(tsValue, Uint16Array);

      return Either.map(uint16Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u16',
          value: item,
        })),
      }));

    case 'Uint32Array':
      const uint32Array = handleTypedArray(tsValue, Uint32Array);

      return Either.map(uint32Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u32',
          value: item,
        })),
      }));

    case 'BigUint64Array':
      const uint64Array = handleTypedArray(tsValue, BigUint64Array);

      return Either.map(uint64Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'u64',
          value: item,
        })),
      }));

    case 'Float32Array':
      const float32Array = handleTypedArray(tsValue, Float32Array);

      return Either.map(float32Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'f32',
          value: item,
        })),
      }));

    case 'Float64Array':
      const float64Array = handleTypedArray(tsValue, Float64Array);

      return Either.map(float64Array, (arr) => ({
        kind: 'list' as const,
        value: Array.from(arr).map((item) => ({
          kind: 'f32',
          value: item,
        })),
      }));
  }

  if (type.isNull()) {
    return Either.right({ kind: 'tuple', value: [] });
  }

  if (type.isBoolean() || name === 'true' || name === 'false') {
    return handleBooleanType(tsValue);
  }

  if (type.isNumber()) {
    if (typeof tsValue === 'number') {
      return Either.right({ kind: 's32', value: tsValue });
    } else {
      return Either.left(invalidTypeError(tsValue, 'number'));
    }
  }

  if (type.isBigInt()) {
    if (typeof tsValue === 'bigint' || typeof tsValue === 'number') {
      return Either.right({ kind: 'u64', value: tsValue as any });
    } else {
      return Either.left(invalidTypeError(tsValue, 'bigint'));
    }
  }

  if (type.isString()) {
    if (typeof tsValue === 'string') {
      return Either.right({ kind: 'string', value: tsValue });
    } else {
      return Either.left(invalidTypeError(tsValue, 'string'));
    }
  }

  if (type.isArray()) return handleArrayType(tsValue, type);

  if (name === 'Promise') {
    const inner = type.getPromiseElementType();

    if (!inner) {
      return Either.left(
        unexpectedTypeError(
          tsValue,
          type,
          Option.some('Unable to infer the type of promise'),
        ),
      );
    }
    return fromTsValue(tsValue, inner);
  }

  if (type.isTuple()) return handleTupleType(tsValue, type);

  if (type.isUnion()) {
    return handleUnion(tsValue, type);
  }

  if (name === 'Map') return handleKeyValuePairs(tsValue, type);

  if (type.isObject()) {
    return handleObject(tsValue, type);
  }

  if (type.isInterface()) {
    return handleObject(tsValue, type);
  }

  return Either.left(unexpectedTypeError(tsValue, type, Option.none()));
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

function handleArrayType(
  tsValue: any,
  type: Type,
): Either.Either<Value, string> {
  const typeArg = type.getArrayElementType();

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
    return Either.left(invalidTypeError(tsValue, tsValue));
  }
  const innerProperties: Symbol[] = type.getProperties();
  const values: Value[] = [];

  for (const prop of innerProperties) {
    const key = prop.getName();

    const nodes: Node[] = prop.getDeclarations();
    const node = nodes[0];
    const propType = prop.getTypeAtLocation(node);

    if (!Object.prototype.hasOwnProperty.call(tsValue, key)) {
      if (Node.isPropertySignature(node) || Node.isPropertyDeclaration(node)) {
        if (node.hasQuestionToken()) {
          values.push({ kind: 'option' });
        } else if (propType.isString() && tsValue === '') {
          values.push({ kind: 'string', value: '' });
        } else if (propType.isNumber() && tsValue === 0) {
          values.push({ kind: 's32', value: 0 });
        } else if (propType.isBoolean() && tsValue === false) {
          values.push({ kind: 'bool', value: false });
        } else {
          return Either.left(missingValueForKey(key, tsValue));
        }
        continue;
      }
    }

    const fieldVal = fromTsValue(tsValue[key], propType);

    if (Either.isLeft(fieldVal)) {
      return Either.left(fieldVal.left);
    }

    values.push(fieldVal.right);
  }

  return Either.right({ kind: 'record', value: values });
}

function handleUnion(tsValue: any, type: Type): Either.Either<Value, string> {
  const possibleTypes = type.getUnionTypes();
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
  const name = type.getName();

  if (type.isNumber()) {
    return typeof value === 'number';
  }

  if (type.isBoolean() || name === 'true' || name === 'false') {
    return typeof value === 'boolean';
  }

  if (type.isString()) {
    return typeof value === 'string';
  }

  if (type.isNull()) {
    return value === null;
  }

  if (type.isUndefined()) {
    return value === undefined;
  }

  if (type.isArray()) {
    const elemType = type.getTypeArguments?.()[0];
    return matchesArray(value, elemType);
  }

  if (type.isTuple()) {
    return matchesTuple(value, type.getTypeArguments?.());
  }

  if (name === 'Map' && type.getTypeArguments().length === 2) {
    const [keyType, valType] = type.getTypeArguments?.() ?? [];

    if (!keyType || !valType) {
      return false;
    }
    if (!(value instanceof Map)) return false;

    return Array.from(value.entries()).every(
      ([k, v]) => matchesType(k, keyType) && matchesType(v, valType),
    );
  }

  if (type.isObject()) {
    return handleObjectMatch(value, type);
  }

  if (type.isInterface()) {
    return handleObjectMatch(value, type);
  }

  if (type.isUnion()) {
    return type.getUnionTypes().some((t) => matchesType(value, t));
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

  const props: Symbol[] = type.getProperties();

  const valueKeys = Object.keys(value);
  if (valueKeys.length !== props.length) return false;

  for (const prop of props) {
    const propName = prop.getName();
    const hasKey = Object.prototype.hasOwnProperty.call(value, propName);

    const decl = prop.getDeclarations()[0];
    let isOptional = false;

    if (Node.isPropertySignature(decl)) {
      isOptional = decl.hasQuestionToken();
    } else if (Node.isPropertyDeclaration(decl)) {
      isOptional = decl.hasQuestionToken();
    }

    if (!hasKey) {
      if (!isOptional) return false;
    } else {
      const propType = prop.getTypeAtLocation(decl);
      if (!matchesType(value[propName], propType)) return false;
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
  return `Value '${tsValue}' does not match any of the union types: ${unionTypes.map((t) => t.getName()).join(', ')}`;
}

function unexpectedTypeError(
  tsValue: any,
  expectedType: Type,
  message: Option.Option<string>,
): string {
  const error = `Value ${JSON.stringify(tsValue)} cannot be handled. Type of this value is inferred to be ${expectedType.getName()}`;
  return error + (Option.isSome(message) ? ` Reason: ${message.value}` : '');
}

export function toTsValue(value: Value, type: Type): any {
  if (!type) {
    console.log('damn ' + JSON.stringify(value));
  }

  const name = type.getName();

  if (value.kind === 'option') {
    const caseValue = value.value;
    if (!caseValue) {
      return undefined;
    }

    return toTsValue(caseValue, type);

    // const unionTypes = expectedType.getUnionTypes();
    // const matchingType = unionTypes[value.caseIdx];
    //
    // return toTsValue(caseValue, matchingType);
  }

  if (type.isNumber()) {
    return convertToNumber(value);
  }

  if (type.isString()) {
    if (value.kind === 'string') {
      return value.value;
    } else {
      throw new Error(`Expected string, obtained value ${value}`);
    }
  }

  if (type.isBigInt()) {
    return convertToBigInt(value);
  }

  if (type.isNull()) {
    if (value.kind === 'tuple' && value.value.length === 0) {
      return null;
    } else {
      throw new Error(`Expected null (unit), obtained value ${value}`);
    }
  }

  if (type.isBoolean() || name === 'true' || name === 'false') {
    if (value.kind === 'bool') {
      return value.value;
    } else {
      throw new Error(`Expected boolean, obtained value ${value}`);
    }
  }

  switch (name) {
    case 'Uint8Array':
      if (value.kind === 'list') {
        return new Uint8Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Uint8Array, obtained value ${value}`);
      }
    case 'Uint8ClampedArray':
      if (value.kind === 'list') {
        return new Uint8ClampedArray(
          value.value.map((v) => convertToNumber(v)),
        );
      } else {
        throw new Error(`Expected Uint8ClampedArray, obtained value ${value}`);
      }
    case 'Int8Array':
      if (value.kind === 'list') {
        return new Int8Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Int8Array, obtained value ${value}`);
      }

    case 'Int16Array':
      if (value.kind === 'list') {
        return new Int16Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Int16Array, obtained value ${value}`);
      }
    case 'Uint16Array':
      if (value.kind === 'list') {
        return new Uint16Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Uint16Array, obtained value ${value}`);
      }
    case 'Int32Array':
      if (value.kind === 'list') {
        return new Int32Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Int32Array, obtained value ${value}`);
      }
    case 'Uint32Array':
      if (value.kind === 'list') {
        return new Uint32Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Uint32Array, obtained value ${value}`);
      }
    case 'Float32Array':
      if (value.kind === 'list') {
        return new Float32Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Float32Array, obtained value ${value}`);
      }
    case 'Float64Array':
      if (value.kind === 'list') {
        return new Float64Array(value.value.map((v) => convertToNumber(v)));
      } else {
        throw new Error(`Expected Float64Array, obtained value ${value}`);
      }
    case 'BigInt64Array':
      if (value.kind === 'list') {
        return new BigInt64Array(value.value.map((v) => convertToBigInt(v)));
      } else {
        throw new Error(`Expected BigInt64Array, obtained value ${value}`);
      }
    case 'BigUint64Array':
      if (value.kind === 'list') {
        return new BigUint64Array(value.value.map((v) => convertToBigInt(v)));
      } else {
        throw new Error(`Expected BigUint64Array, obtained value ${value}`);
      }
  }

  if (name === 'Promise') {
    const innerType = type.getPromiseElementType();
    if (!innerType) {
      throw new Error(`Expected Promise to have one type argument`);
    }
    return toTsValue(value, innerType);
  }

  if (name === 'Map') {
    const typeArgs = type.getTypeArguments();

    if (typeArgs.length !== 2) {
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
  }

  if (type.isTuple()) {
    const typeArg = type.getTypeArguments?.();
    if (value.kind === 'tuple') {
      return value.value.map((item: Value, idx: number) =>
        toTsValue(item, typeArg[idx]),
      );
    } else {
      throw new Error(`Expected tuple, obtained value ${value}`);
    }
  }

  if (type.isArray()) {
    if (value.kind === 'list') {
      const elemType = type.getArrayElementType();

      if (!elemType) {
        throw new Error(`Unable to infer the type of Array`);
      }
      return value.value.map((item: Value) => toTsValue(item, elemType));
    } else {
      throw new Error(`Expected array, obtained value ${value}`);
    }
  }

  if (type.isObject()) {
    if (value.kind === 'record') {
      const fieldValues = value.value;
      const expectedTypeFields = type.getProperties();
      return expectedTypeFields.reduce(
        (acc, field, idx) => {
          const name = field.getName();
          const expectedFieldType = field.getTypeAtLocation(
            field.getDeclarations()[0],
          );
          acc[name] = toTsValue(fieldValues[idx], expectedFieldType);
          return acc;
        },
        {} as Record<string, any>,
      );
    } else {
      throw new Error(
        `Expected object ${name}, obtained value ${JSON.stringify(value)}`,
      );
    }
  }

  if (type.isInterface()) {
    if (value.kind === 'record') {
      const fieldValues = value.value;
      const expectedTypeFields = type.getProperties();
      return expectedTypeFields.reduce(
        (acc, field, idx) => {
          const name = field.getName();
          const expectedFieldType = field.getTypeAtLocation(
            field.getDeclarations()[0],
          );
          acc[name] = toTsValue(fieldValues[idx], expectedFieldType);
          return acc;
        },
        {} as Record<string, any>,
      );
    } else {
      throw new Error(`Expected object, obtained value ${value}`);
    }
  }

  if (type.isUnion()) {
    if (value.kind === 'variant') {
      const caseValue = value.caseValue;
      if (!caseValue) {
        throw new Error(`Expected value, obtained value ${value}`);
      }

      const unionTypes = type.getUnionTypes();
      const matchingType = unionTypes[value.caseIdx];

      return toTsValue(caseValue, matchingType);
    } else {
      throw new Error(
        `Expected union, obtained value ${JSON.stringify(value)}`,
      );
    }
  }

  throw new Error(`'Type ${name} is not supported in golem'`);
}

function convertToNumber(value: Value): any {
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
}

function convertToBigInt(value: Value): any {
  if (value.kind === 'u64' || value.kind === 's64') {
    return value.value;
  } else {
    throw new Error(`Expected bigint, obtained value ${value}`);
  }
}
