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
  GenericType,
  ObjectType,
  PromiseType,
  Type,
  TypeAliasType,
  TypeKind,
  UnionType,
} from 'rttist';
import { WitValue } from 'golem:rpc/types@0.2.2';
import { constructWitValueFromValue, Value } from './value';
import * as Either from 'effect/Either';
import * as Option from 'effect/Option';
import { isInBuiltResult } from '../types/inbuilt';

export function constructWitValueFromTsValue(
  tsValue: any,
  tsType: Type,
): Either.Either<WitValue, string> {
  return Either.map(
    constructValueFromTsValue(tsValue, tsType),
    constructWitValueFromValue,
  );
}

// Note that we take `type: Type` instead of `type: AnalysedType`(because at this point `AnalysedType` of the `tsValue` is also available)
// as `Type` holds more information, and can be used to determine the error messages for wrong `tsValue` more accurately.
function constructValueFromTsValue(
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
      return constructValueFromTsValue(tsValue, promiseDefArgType);

    case TypeKind.Interface:
      return handleObject(tsValue, type);

    case TypeKind.Union: {
      return handleUnion(tsValue, type);
    }

    case TypeKind.Alias:
      const aliasType = type as TypeAliasType;
      const targetType = aliasType.target;
      return constructValueFromTsValue(tsValue, targetType);

    case TypeKind.Promise:
      const promiseType = type as PromiseType;
      const argument = promiseType.getTypeArguments()[0];
      return constructValueFromTsValue(tsValue, argument);

    case TypeKind.Type:
      return handleGeneralType(tsValue, type);

    case TypeKind.ObjectType:
      return handleObject(tsValue, type);

    case TypeKind.Uint8Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 'u8', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Uint8Array'));
      }
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
    case TypeKind.Int16Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 's16', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Int16Array'));
      }
    case TypeKind.Uint16Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 'u16', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Uint16Array'));
      }
    case TypeKind.Int32Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 's32', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Int32Array'));
      }
    case TypeKind.Uint32Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 'u32', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Uint32Array'));
      }
    case TypeKind.Float32Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 'f32', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Float32Array'));
      }
    case TypeKind.Float64Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'number')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 'f64', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'Float64Array'));
      }
    case TypeKind.BigInt64Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'bigint')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 's64', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'BigInt64Array'));
      }
    case TypeKind.BigUint64Array:
      if (
        Array.isArray(tsValue) &&
        tsValue.every((item) => typeof item === 'bigint')
      ) {
        return Either.right({
          kind: 'list',
          value: tsValue.map((item) => ({ kind: 'u64', value: item })),
        });
      } else {
        return Either.left(invalidTypeError(tsValue, 'BigUint64Array'));
      }
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
    Either.all(tsValue.map((item) => constructValueFromTsValue(item, typeArg))),
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
    Either.all(
      tsValue.map((item, idx) =>
        constructValueFromTsValue(item, typeArgs[idx]),
      ),
    ),
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
  return constructValueFromTsValue(tsValue, innerType);
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

      const okValue = constructValueFromTsValue(okTsVal, okType);

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

      const errValue = constructValueFromTsValue(errTsVal, errorType);

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
        constructValueFromTsValue(key, keyType),
        constructValueFromTsValue(value, valueType),
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

    const fieldVal = constructValueFromTsValue(tsValue[key], prop.type);

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

    return Either.map(
      constructValueFromTsValue(tsValue, innerType),
      (result) => {
        return {
          kind: 'variant',
          caseIdx: typeWithIndex[1],
          caseValue: result,
        };
      },
    );
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
