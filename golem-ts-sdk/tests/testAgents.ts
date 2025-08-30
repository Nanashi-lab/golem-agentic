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

import { agent, BaseAgent } from '../src';
import { getTypeName, Type, TypeMetadata } from '@golemcloud/golem-ts-types-core';
import { AnalysedType, NameTypePair } from '../src/internal/mapping/types/AnalysedType';

import './load-types'

@agent()
class WeatherAgent extends BaseAgent {
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
    objectType: ObjectType,
  ): PromiseType {
    return Promise.resolve(`Weather for ${location} is sunny!`);
  }
}

@agent()
class AssistantAgent extends BaseAgent {
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
    objectType: ObjectType,
  ): PromiseType {
    return Promise.resolve(`Weather for ${location} is sunny!`);
  }
}


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
  | SimpleInterfaceType
  | MapType
  | ListType
  | ListComplexType;

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
  objectPropInlined: {
    a: string;
    b: number;
    c: boolean;
  };
  unionPropInlined: string | number;
  // recordProp: RecordType;
  // enumType: EnumTypeAlias;
  // enumTypeInlined: EnumType,

  // enumProp: EnumTypeAlias,
  // enumPropInlined: EnumTypeAlias,
}




export function getAll() {
  return TypeMetadata.getAll();
}

export function getTestInterfaceType(): Type {
  return fetchType('TestInterfaceType');
}

export function getTestMapType(): Type {
  return fetchType('Map');
}

export function getTestObjectType(): Type {
  return fetchType('ObjectType');
}

export function getTestListOfObjectType(): Type {
  return fetchType('Array');
}

export function getUnionType(): Type {
  return fetchType('UnionType');
}

export function getUnionComplexType(): Type {
  return fetchType('UnionComplexType');
}

export function getTupleType(): Type {
  return fetchType('TupleType');
}

export function getTupleComplexType(): Type {
  return fetchType('TupleComplexType');
}

export function getBooleanType(): Type {
  return fetchType('boolean');
}

export function getStringType(): Type {
  return fetchType('string');
}

export function getNumberType(): Type {
  return fetchType('number');
}

export function getPromiseType(): Type {
  return fetchType('Promise');
}

export function getRecordFieldsFromAnalysedType(
  analysedType: AnalysedType,
): NameTypePair[] | undefined {
  return analysedType.kind === 'record' ? analysedType.value.fields : undefined;
}

function fetchType(typeNameInTestData: string): Type {
  const classMetadata = Array.from(getAll()).map(([_, v]) => v);

  for (const type of classMetadata) {
    const constructorArg = type.constructorArgs.find((arg) => {
      const typeName = getTypeName(arg.type);
      return typeName === typeNameInTestData;
    });

    if (constructorArg) {
      return constructorArg.type;
    }

    const methods = Array.from(type.methods.values());

    for (const method of methods) {
      if (
        method.returnType &&
        getTypeName(method.returnType) === typeNameInTestData
      ) {
        return method.returnType;
      }

      const param = Array.from(method.methodParams.entries()).find(([_, t]) => {
        const typeName = getTypeName(t);
        return typeName === typeNameInTestData;
      });

      if (param) {
        return param[1];
      }
    }
  }

  throw new Error(`Type ${typeNameInTestData} not found in metadata`);
}
