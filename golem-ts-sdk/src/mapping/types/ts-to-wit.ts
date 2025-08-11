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
    AnalysedType,
    NameOptionTypePair,
} from './analysed-type';
import {GenericType, Type, TypeAliasType, UnionType} from "rttist";
import {InterfaceType, ObjectType, Type as TsType, TypeKind} from "rttist";
import {analysedType} from "./analysed-type";
import {WitTypeBuilder} from "./wit-type-builder";
import {numberToOrdinalKebab} from "./type-index-ordinal";
import * as Either from "effect/Either";
import {WitType} from "golem:agent/common";

export function constructWitTypeFromTsType(type: Type): Either.Either<WitType, string> {
    return Either.flatMap(constructAnalysedTypeFromTsType(type), (analysedType) => {
        const builder = new WitTypeBuilder();
        builder.add(analysedType);
        const result = builder.build();
        return Either.right(result);
    })
}

export function constructAnalysedTypeFromTsType(type: TsType): Either.Either<AnalysedType, string> {
    switch (type.kind) {
        case TypeKind.Boolean:
            return Either.right(analysedType.bool());
        case TypeKind.False:
            return Either.right(analysedType.bool());
        case TypeKind.True:
            return Either.right(analysedType.bool());
        case TypeKind.DataView:
            return Either.right(analysedType.list(analysedType.u8()));
        case TypeKind.MapDefinition:
            const mapKeyType = type.getTypeArguments?.()[0];
            const mapValueType = type.getTypeArguments?.()[1];
            const key = constructAnalysedTypeFromTsType(mapKeyType);
            const value = constructAnalysedTypeFromTsType(mapValueType);

            return Either.zipWith(key, value, (k, v) =>
                analysedType.list(analysedType.tuple([k, v])));

        case TypeKind.WeakMapDefinition:
            const weakMapKeyType = type.getTypeArguments?.()[0];
            const weakMapValueType = type.getTypeArguments?.()[1];
            const weakKey = constructAnalysedTypeFromTsType(weakMapKeyType);
            const weakValue = constructAnalysedTypeFromTsType(weakMapValueType);

            return Either.zipWith(
                weakKey,
                weakValue,
                (k, v) => analysedType.list(analysedType.tuple([k, v])
            ));

        case TypeKind.IteratorDefinition:
            const iteratorType = type.getTypeArguments?.()[0];

            if (!iteratorType) {
               return Either.left("Iterator must have a type argument");
            } else {
               return Either.map(constructAnalysedTypeFromTsType(iteratorType), (result) => analysedType.list(result));
            }

        case TypeKind.IterableDefinition:
            const iterableType = type.getTypeArguments?.()[0];
            if (!iterableType) {
                return Either.left("Iterable must have a type argument");
            } else {
                return Either.map(constructAnalysedTypeFromTsType(iterableType), (result) => analysedType.list(result));
            }

        case TypeKind.IterableIteratorDefinition:
            const iterableIteratorType = type.getTypeArguments?.()[0];
            if (!iterableIteratorType) {
                return Either.left("IterableIterator must have a type argument");
            } else {
                return Either.map(constructAnalysedTypeFromTsType(iterableIteratorType), (result) => analysedType.list(result));
            }

        case TypeKind.Type:
            if (type.isArray()) {
                const typeArg = type.getTypeArguments?.()[0];

                if (!typeArg) {
                    return Either.left("Array must have a type argument");
                }

                return Either.map(constructAnalysedTypeFromTsType(typeArg), (result) =>
                    analysedType.list(result));

            }  else if (type.isTuple()) {
                const tupleTypes =
                    Either.all(type.getTypeArguments?.().map(constructAnalysedTypeFromTsType)) || Either.all([]);

                return Either.map(tupleTypes, (analysedTypes) => analysedType.tuple(analysedTypes))

            } else if (type.isGenericType()) {
                const genericType: GenericType<typeof type> = (type as GenericType<typeof type>);
                const genericTypeDefinition = genericType.genericTypeDefinition;
                if (genericTypeDefinition.name === 'Map') {
                    const typeArgs = type.getTypeArguments?.();
                    if (!typeArgs || typeArgs.length !== 2) {
                       return Either.left("Map must have a type argument");
                    }
                    const keyType = constructAnalysedTypeFromTsType(typeArgs[0]);
                    const valueType = constructAnalysedTypeFromTsType(typeArgs[1]);

                    return Either.zipWith(keyType, valueType, (keyType, valueType) =>
                        analysedType.list(analysedType.tuple([keyType, valueType])))

                } else {
                    return Either.left("Type must have a type argument");
                }
            } else {
                const typeArg = type.getTypeArguments?.()[0];

                if (!typeArg) {
                    return Either.left("Array must have a type argument");
                }

                return constructAnalysedTypeFromTsType(typeArg);
            }

        case TypeKind.Object:
            const object = type as ObjectType;
            const props = object.getProperties();
            if (props.length === 0) {
               return Either.left(`Unsupported type for type ${type}`);
            }

            const objectFields = Either.all(props.map(prop =>
                Either.map(constructAnalysedTypeFromTsType(prop.type), (propType) =>
                    analysedType.field(prop.name.toString(), propType))
            ));

            return Either.map(objectFields, (fields) => analysedType.record(fields))

        case TypeKind.Interface:
            const objectInterface = type as InterfaceType;
            const interfaceFields = Either.all(objectInterface.getProperties().map(prop => {
                const propertyAnalysedType = constructAnalysedTypeFromTsType(prop.type);

                if (prop.optional) {
                    return Either.map(propertyAnalysedType, (result) =>
                      analysedType.field(prop.name.toString(), analysedType.option(result))
                    )
                } else {
                    return Either.map(propertyAnalysedType, (result) =>
                        analysedType.field(prop.name.toString(), result)
                    )
                }
            }));

            return Either.map(interfaceFields, (fields) => analysedType.record(fields));

        case TypeKind.Union:
            let fieldIdx = 1;
            const unionType = type as UnionType;
            // To get over a bug in RTTIST where boolean fields within a union type is considered separately as true and false

            let foundBool = false;
            let possibleTypes: NameOptionTypePair[] = []

            for (const t of unionType.types) {
                switch(t.kind) {
                    case TypeKind.Boolean:
                        if (!foundBool) {
                            Either.map(constructAnalysedTypeFromTsType(t), (result) => {
                                possibleTypes.push({
                                    name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
                                    typ: result
                                });
                            })
                        }

                        foundBool = true;
                        continue;
                    case TypeKind.True:
                        if (!foundBool) {
                            Either.map(constructAnalysedTypeFromTsType(t), (result) => {
                                possibleTypes.push({
                                    name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
                                    typ: result
                                });
                            })
                        }

                        foundBool = true;
                        continue;
                    case TypeKind.False:
                        if (!foundBool) {
                            Either.map(constructAnalysedTypeFromTsType(t), (result) => {
                                possibleTypes.push({
                                    name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
                                    typ: result
                                });
                            })
                        }

                        foundBool = true;
                        continue;
                    default:
                        Either.map(constructAnalysedTypeFromTsType(t), (result) => {
                            possibleTypes.push({
                                name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
                                typ: result
                            });
                        })
                }

            }

            return Either.right(analysedType.variant(possibleTypes))

        case TypeKind.Alias:
            const typeAlias = type as TypeAliasType;
            return constructAnalysedTypeFromTsType(typeAlias.target)

        case TypeKind.Null:
            return Either.right(analysedType.tuple([]))

        case TypeKind.BigInt:
            return Either.right(analysedType.u64());

        case TypeKind.Float64Array:
            return Either.right(analysedType.f64());

        case TypeKind.Number:
            return Either.right(analysedType.s32()); // For the same reason - as an example - Rust defaults to i32

        case TypeKind.String:
            return Either.right(analysedType.str());

        case TypeKind.RegExp:
            return Either.right(analysedType.str());

        case TypeKind.Error:
            return Either.right(analysedType.resultErr(analysedType.str()));

        case TypeKind.Int8Array:
            return Either.right(analysedType.list(analysedType.s8()));

        case TypeKind.Uint8Array:
            return Either.right(analysedType.list(analysedType.u8()));

        case TypeKind.Uint8ClampedArray:
            return Either.right(analysedType.list(analysedType.u8()));

        case TypeKind.ArrayBuffer:
            return Either.right(analysedType.list(analysedType.u8()));

        case TypeKind.SharedArrayBuffer:
            return Either.right(analysedType.list(analysedType.u8()));

        case TypeKind.Int16Array:
            return Either.right(analysedType.list(analysedType.s16()));

        case TypeKind.Uint16Array:
            return Either.right(analysedType.list(analysedType.u16()));

        case TypeKind.Int32Array:
            return Either.right(analysedType.list(analysedType.s32()));

        case TypeKind.Uint32Array:
            return Either.right(analysedType.list(analysedType.u32()));

        case TypeKind.Float32Array:
            return Either.right(analysedType.list(analysedType.f32()));

        case TypeKind.BigInt64Array:
            return Either.right(analysedType.list(analysedType.s64()));

        case TypeKind.BigUint64Array:
            return Either.right(analysedType.list(analysedType.u64()));

        case TypeKind.NumberLiteral:
            return Either.right(analysedType.f64());
        case TypeKind.BigIntLiteral:
            return Either.right(analysedType.s64());
        case TypeKind.StringLiteral:
            return Either.right(analysedType.str());

        case TypeKind.Promise:
            const promiseType = type.getTypeArguments?.()[0];

            if (!promiseType) {
                return Either.left("Promise must have a type argument");
            }

            return constructAnalysedTypeFromTsType(promiseType);

        case TypeKind.PromiseDefinition:
            const promiseDefType = type.getTypeArguments?.()[0];

            if (!promiseDefType) {
                return Either.left("PromiseDefinition must have a type argument");
            }

            return Either.map(constructAnalysedTypeFromTsType(promiseDefType), analysedType.option);

        case TypeKind.ObjectType:
            const obj = type as ObjectType;
            const fields = Either.all(obj.getProperties().map(prop => {
                return Either.map(constructAnalysedTypeFromTsType(prop.type), (result) => analysedType.field(prop.name.toString(), result));
            }));

            return Either.map(fields, analysedType.record);

        case TypeKind.TupleDefinition:
            const tupleTypes =
                Either.all(type.getTypeArguments?.().map(constructAnalysedTypeFromTsType)) || Either.all([]);

            return Either.map(tupleTypes, analysedType.tuple);

        case TypeKind.ArrayDefinition:
            const arrayType = type.getTypeArguments?.()[0];

            if (!arrayType) {
                return Either.left("Array must have a type argument");
            }
            return Either.map(constructAnalysedTypeFromTsType(arrayType), analysedType.list)

        case TypeKind.ReadonlyArrayDefinition:
            const elementType = type.getTypeArguments?.()[0];

            if (!elementType) {
                return Either.left("Array must have a type argument");
            }
            return Either.map(constructAnalysedTypeFromTsType(elementType), analysedType.list)

        default:
            return Either.left(`The following type is not supported as argument or return type in agentic context ${type.displayName}`);
    }
}
