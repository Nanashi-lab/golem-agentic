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
  InterfaceType,
  ObjectType,
  PromiseType,
  PropertyInfo,
  Type,
  TypeAliasType,
  TypeKind,
  UnionType,
} from 'rttist';
import { WitValue } from 'golem:rpc/types@0.2.2';
import { constructValueFromWitValue, Value } from './value';

// Note that we take `expectedType: Type` instead of `expectedType: AnalysedType`(because at this point `AnalysedType` of the `witValue`
// is also available) as `Type` holds more information, and help us have fine-grained control over the type conversion.
// Hence, we need to use `Type` instead of `AnalysedType`. Note that the output of this function is a real ts-value,
// and we need to ensure it is compatible with the `expectedType: Type`.
export function constructTsValueFromWitValue(
  witValue: WitValue,
  expectedType: Type,
): any {
  const value = constructValueFromWitValue(witValue);
  return constructTsValueFromValue(value, expectedType);
}

function constructTsValueFromValue(value: Value, expectedType: Type): any {
  if (value === undefined) {
    return null;
  }

  // There is no option type in type-script, so take analysed type along with expected type.
  if (value.kind === 'option') {
    if (!value.value) {
      return null;
    } else {
      return constructTsValueFromValue(value.value, expectedType);
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
        value.kind === 's64'
      ) {
        return value.value;
      } else {
        throw new Error(`Expected number, obtained value ${value}`);
      }
    case TypeKind.BigInt:
      if (value.kind === 'u64') {
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
            acc[name] = constructTsValueFromValue(
              fieldValues[idx],
              expectedFieldType,
            );
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
            acc[name] = constructTsValueFromValue(
              fieldValues[idx],
              expectedFieldType,
            );
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
        return new Int8Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Int8Array, obtained value ${value}`);
      }
    case TypeKind.Uint8Array:
      if (value.kind === 'list') {
        return new Uint8Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint8Array, obtained value ${value}`);
      }
    case TypeKind.Uint8ClampedArray:
      if (value.kind === 'list') {
        return new Uint8ClampedArray(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint8ClampedArray, obtained value ${value}`);
      }
    case TypeKind.Int16Array:
      if (value.kind === 'list') {
        return new Int16Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Int16Array, obtained value ${value}`);
      }
    case TypeKind.Uint16Array:
      if (value.kind === 'list') {
        return new Uint16Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint16Array, obtained value ${value}`);
      }
    case TypeKind.Int32Array:
      if (value.kind === 'list') {
        return new Int32Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Int32Array, obtained value ${value}`);
      }
    case TypeKind.Uint32Array:
      if (value.kind === 'list') {
        return new Uint32Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Uint32Array, obtained value ${value}`);
      }
    case TypeKind.Float32Array:
      if (value.kind === 'list') {
        return new Float32Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Float32Array, obtained value ${value}`);
      }
    case TypeKind.Float64Array:
      if (value.kind === 'list') {
        return new Float64Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.Number)),
        );
      } else {
        throw new Error(`Expected Float64Array, obtained value ${value}`);
      }
    case TypeKind.BigInt64Array:
      if (value.kind === 'list') {
        return new BigInt64Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.BigInt)),
        );
      } else {
        throw new Error(`Expected BigInt64Array, obtained value ${value}`);
      }
    case TypeKind.BigUint64Array:
      if (value.kind === 'list') {
        return new BigUint64Array(
          value.value.map((v) => constructTsValueFromValue(v, Type.BigInt)),
        );
      } else {
        throw new Error(`Expected BigUint64Array, obtained value ${value}`);
      }
    case TypeKind.ArrayBuffer:
      if (value.kind === 'list') {
        const byteArray = value.value.map((v) => {
          const convertedValue = constructTsValueFromValue(v, Type.Number);
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
          const convertedValue = constructTsValueFromValue(v, Type.Number);
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
          const convertedValue = constructTsValueFromValue(v, Type.Number);
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
            const tsValue = constructTsValueFromValue(
              fieldValues[idx],
              expectedFieldType,
            );
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
            const tsValue = constructTsValueFromValue(
              fieldValues[idx],
              expectedFieldType,
            );
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

        return constructTsValueFromValue(caseValue, matchingType);
      } else {
        throw new Error(`Expected union, obtained value ${value}`);
      }
    case TypeKind.Alias:
      const aliasType = expectedType as TypeAliasType;
      const targetType = aliasType.target;
      return constructTsValueFromValue(value, targetType);
    case TypeKind.StringLiteral:
      if (value.kind === 'string') {
        return value.value;
      } else {
        throw new Error(`Unrecognized value for ${value.kind}`);
      }
    case TypeKind.Promise:
      const innerType = (expectedType as PromiseType).getTypeArguments()[0];
      return constructTsValueFromValue(value, innerType);
    case TypeKind.Type:
      if (expectedType.isArray()) {
        if (value.kind === 'list') {
          return value.value.map((item: Value) =>
            constructTsValueFromValue(
              item,
              expectedType.getTypeArguments?.()[0],
            ),
          );
        } else {
          throw new Error(`Expected array, obtained value ${value}`);
        }
      } else if (expectedType.isTuple()) {
        const typeArg = expectedType.getTypeArguments?.();
        if (value.kind === 'tuple') {
          return value.value.map((item: Value, idx: number) =>
            constructTsValueFromValue(item, typeArg[idx]),
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
                constructTsValueFromValue(item.value[0], typeArgs[0]),
                constructTsValueFromValue(item.value[1], typeArgs[1]),
              ] as [any, any];
            });
            return new Map(entries);
          } else {
            throw new Error(`Expected Map, obtained value ${value}`);
          }
        } else {
          throw new Error('Type must have a type argument');
        }
      } else {
        const arg = expectedType.getTypeArguments?.()[0];
        if (!arg) {
          throw new Error('Type must have a type argument');
        }
        return constructTsValueFromValue(value, arg);
      }

    default:
      throw new Error(
        `'${expectedType.displayName} with kind ${expectedType.kind} not supported'`,
      );
  }
}
