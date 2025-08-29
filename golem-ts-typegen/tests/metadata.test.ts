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

import { describe, expect, it } from "vitest";
import {
  getBooleanType,
  getNumberType,
  getStringType,
  getTestListOfObjectType,
  getTestMapType,
  getObjectType,
  getTupleType,
  getUnionComplexType,
  getUnionType,
  getComplexObjectType,
  getInterfaceType,
} from "./util.js";

describe("golem-ts-typegen can work correctly read types from .metadata directory", () => {
  it("track interface type", () => {
    const stringType = getStringType();
    expect(stringType.isString()).toEqual(true);
  });

  it("track number type", () => {
    const numberType = getNumberType();
    expect(numberType.isNumber()).toEqual(true);
  });

  it("track boolean type", () => {
    const booleanType = getBooleanType();
    expect(booleanType.isBoolean()).toEqual(true);
  });

  it("track map type", () => {
    const mapType = getTestMapType();
    expect(mapType.isMap()).toEqual(true);
  });

  it("track tuple type", () => {
    const tupleType = getTupleType();
    expect(tupleType.isTuple()).toEqual(true);
  });

  it("track array type", () => {
    const tupleType = getTestListOfObjectType();
    expect(tupleType.isArray()).toEqual(true);
  });

  it("track object type", () => {
    const objectType1 = getObjectType();
    expect(objectType1.isObject()).toEqual(true);

    const objectType2 = getComplexObjectType();
    expect(objectType2.isObject()).toEqual(true);
  });

  it("track union type", () => {
    const unionType1 = getUnionComplexType();
    expect(unionType1.isUnion()).toEqual(true);

    const unionType2 = getUnionType();
    expect(unionType2.isUnion()).toEqual(true);
  });

  it("track interface type", () => {
    const tupleType = getInterfaceType();
    expect(tupleType.isInterface()).toEqual(true);
  });
});
