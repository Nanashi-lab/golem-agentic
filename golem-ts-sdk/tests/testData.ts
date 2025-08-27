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

import { Either } from '../src/newTypes/either';
import { agent, BaseAgent } from '../src';

// DO NOT RENAME INTERFACES OR PROPERTIES.
// These names are introspected using RTTIST metadata reflection
// and are used in unit tests.

// These interfaces define the set of TypeScript types that are officially
// supported and guaranteed by the SDK’s type mapping layer.

// Whatever you add here will be tested automatically in the unit test with no further change.
// This will at least ensure the mapping layer does not break for these types.
// However, you can/should explicitly test the behavior of a specific type by adding necessary utility
// functions in type-utils.ts in tests module.

interface SimpleInterfaceType {
  n: number;
}

export type PromiseType = Promise<string>;

export type ObjectType = { a: string; b: number; c: boolean };

export type UnionType = number | string | boolean | ObjectType;

export type ListType = Array<string>;

export type ListComplexType = Array<ObjectType>;

export type TupleType = [string, number, boolean];

export type TupleComplexType = [string, number, ObjectType];

export type MapType = Map<string, number>;

// Boolean has special behavior with RTTIST, so we test it explicitly
export type BooleanType = boolean;

export type StringType = string;

export type NumberType = number;

export type UnionComplexType =
  | number
  | string
  | boolean
  | ObjectComplexType
  | UnionType
  | TupleType
  | TupleComplexType
  | SimpleInterfaceType;
// FIXME: RTTIST don't support these types to be part of union yet - fails at type-gen
//| Result<String, string>
// | MapType
// | ListType
// | ListComplexType

export type ObjectComplexType = {
  a: string;
  b: number;
  c: boolean;
  d: ObjectType;
  e: UnionType;
  f: ListType;
  g: ListComplexType;
  h: TupleType;
  i: TupleComplexType;
  j: MapType;
  k: SimpleInterfaceType;
  l: Either<number, string>;
  //m: Either.Either<number, string> // FIXME: Effect.Either is inferred as Invalid by RTTIST
};

export interface TestInterfaceType {
  numberProp: number;
  stringProp: string;
  booleanProp: boolean;
  bigintProp: bigint;
  nullProp: null;
  trueProp: true;
  falseProp: false;
  optionalProp?: number;
  nestedProp: SimpleInterfaceType;
  unionProp: UnionType;
  unionComplexProp: UnionComplexType;
  objectProp: ObjectType;
  objectComplexProp: ObjectComplexType;
  listProp: ListType;
  listObjectProp: ListComplexType;
  tupleProp: TupleType;
  tupleObjectProp: TupleComplexType;
  mapProp: MapType;
  uint8ArrayProp: Uint8Array;
  uint16ArrayProp: Uint16Array;
  uint32ArrayProp: Uint32Array;
  uint64ArrayProp: BigUint64Array;
  int8ArrayProp: Int8Array;
  int16ArrayProp: Int16Array;
  int32ArrayProp: Int32Array;
  int64ArrayProp: BigInt64Array;
  float32ArrayProp: Float32Array;
  float64ArrayProp: Float64Array;
  // FIXME, `RTTIST` bug or not supported yet
  // mapAlternativeProp: MapTypeAlternative,
  // unionPropInlined: string | number;
  // recordProp: RecordType;
  // enumType: EnumTypeAlias;
  // enumTypeInlined: EnumType,
  // objectPropInlined: {
  //     a: string,
  //     b: number,
  //     c: boolean
  // }
  // enumProp: EnumTypeAlias,
  // enumPropInlined: EnumTypeAlias,
}

// FIXME: RTTIST don't support these yet
// type MapTypeAlternative = { [key: string]: number };
// type RecordType = Record<number, string>;

// enum EnumType {
//     First = 'First',
//     Second = 1,
// }
//
// type EnumTypeAlias = EnumType;

@agent()
class MyAgent extends BaseAgent {
  constructor(readonly testInterfaceType: TestInterfaceType) {
    super();
    this.testInterfaceType = testInterfaceType;
  }

  async getWeather(
    complexType: ObjectComplexType,
    unionType: UnionType,
    unionComplexType: UnionComplexType,
    numberType: NumberType,
    stringType: StringType,
    booleanType: BooleanType,
    mapType: MapType,
    tupleComplexType: TupleComplexType,
    tupleType: TupleType,
    listComplexType: ListComplexType,
    listType: ListType,
    objectType: ObjectType,
  ): PromiseType {
    return Promise.resolve(`Weather for ${location} is sunny!`);
  }
}
