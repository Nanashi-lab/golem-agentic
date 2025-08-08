import { describe, it, expect } from 'vitest';
import {
  getTestMapType,
  getTestInterfaceType,
  getTestObjectType,
  getTestListType,
  getTestListOfObjectType,
  getTupleComplexType,
  getTupleType,
} from './utils';
import { TestInterfaceType } from './test-data';
import {
  constructValueFromWitValue,
  constructWitValueFromValue,
} from '../src/mapping/values/value';
import { constructWitValueFromTsValue } from '../src/mapping/values/ts-to-wit';
import { constructTsValueFromWitValue } from '../src/mapping/values/wit-to-ts';
import {
  interfaceArb,
  listArb,
  mapArb,
  objectArb,
  listComplexArb,
  tupleComplexArb,
  tupleArb,
} from './arbitraries';
import * as fc from 'fast-check';
import { Type } from 'rttist';

describe('typescript value to wit value round-trip conversions', () => {
  it('should correctly perform round-trip conversion for arbitrary values of interface type', () => {
    fc.assert(
      fc.property(interfaceArb, (arbData) => {
        const type = getTestInterfaceType();
        runRoundTripTest(arbData, type);
      }),
    );
  });

  it('should correctly perform round-trip conversion for arbitrary values of object type', () => {
    fc.assert(
      fc.property(objectArb, (arbData) => {
        const type = getTestObjectType();
        runRoundTripTest(arbData, type);
      }),
    );
  });

  it('should correctly perform round-trip conversion for arbitrary values of map type', () => {
    fc.assert(
      fc.property(mapArb, (arbData) => {
        const type = getTestMapType();
        runRoundTripTest(arbData, type);
      }),
    );
  });

  it('should correctly perform round-trip conversion for arbitrary values of list type', () => {
    fc.assert(
      fc.property(listArb, (arbData) => {
        const type = getTestListType();
        runRoundTripTest(arbData, type);
      }),
    );
  });

  it('should correctly perform round-trip conversion for arbitrary values of list of object type', () => {
    fc.assert(
      fc.property(listComplexArb, (arbData) => {
        const type = getTestListOfObjectType();
        runRoundTripTest(arbData, type);
      }),
    );
  });

  it('should correctly perform round-trip conversion for arbitrary values of complex tuple', () => {
    fc.assert(
      fc.property(tupleArb, tupleComplexArb, (tupleData, tupleComplexData) => {
        const simpleType = getTupleType();
        runRoundTripTest(tupleData, simpleType);

        const type = getTupleComplexType();
        runRoundTripTest(tupleComplexData, type);
      }),
    );
  });

  it('should preserve values with only required properties (excluding optional)', () => {
    const defaultData: TestInterfaceType = {
      bigintProp: 0n,
      booleanProp: false,
      falseProp: false,
      listObjectProp: [],
      listProp: [],
      mapProp: new Map<string, number>(),
      nestedProp: { n: 0 },
      objectComplexProp: {
        a: '',
        b: 0,
        c: false,
        d: {
          a: '',
          b: 0,
          c: false,
        },
        e: '',
        f: [],
        g: [],
        h: ['', 0, false],
        i: ['', 0, { a: '', b: 0, c: false }],
        j: new Map<string, number>(),
        k: { n: 0 },
      },
      nullProp: null,
      numberProp: 0,
      objectProp: { a: '', b: 0, c: false },
      stringProp: '',
      trueProp: true,
      tupleObjectProp: ['', 0, { a: '', b: 0, c: false }],
      tupleProp: ['', 0, false],
      unionProp: 1,
    };

    const type = getTestInterfaceType();

    runRoundTripTest(defaultData, type);
  });

  it('should preserve values including optional properties', () => {
    const withOptionalValues: TestInterfaceType = {
      bigintProp: 0n,
      booleanProp: false,
      falseProp: false,
      listObjectProp: [],
      listProp: [],
      mapProp: new Map<string, number>(),
      nestedProp: { n: 0 },
      nullProp: null,
      numberProp: 0,
      objectProp: { a: '', b: 0, c: false },
      stringProp: '',
      trueProp: true,
      tupleObjectProp: ['', 0, { a: '', b: 0, c: false }],
      tupleProp: ['', 0, false],
      unionProp: 1,
      optionalProp: 2,
      objectComplexProp: {
        a: '',
        b: 0,
        c: false,
        d: {
          a: '',
          b: 0,
          c: false,
        },
        e: '',
        f: [],
        g: [],
        h: ['', 0, false],
        i: ['', 0, { a: '', b: 0, c: false }],
        j: new Map<string, number>(),
        k: { n: 0 },
      },
    };

    const type = getTestInterfaceType();

    runRoundTripTest(withOptionalValues, type);
  });

  it('should preserve union properties with complex object variants', () => {
    const withComplexUnionType: TestInterfaceType = {
      bigintProp: 0n,
      booleanProp: false,
      falseProp: false,
      listObjectProp: [],
      listProp: [],
      mapProp: new Map<string, number>(),
      nestedProp: { n: 0 },
      nullProp: null,
      numberProp: 0,
      objectProp: { a: '', b: 0, c: false },
      stringProp: '',
      trueProp: true,
      tupleObjectProp: ['', 0, { a: '', b: 0, c: false }],
      tupleProp: ['', 0, false],
      unionProp: { a: 'test', b: 42, c: true }, // Using an object as a union type
      optionalProp: 2,
      objectComplexProp: {
        a: '',
        b: 0,
        c: false,
        d: {
          a: '',
          b: 0,
          c: false,
        },
        e: '',
        f: [],
        g: [],
        h: ['', 0, false],
        i: ['', 0, { a: '', b: 0, c: false }],
        j: new Map<string, number>(),
        k: { n: 0 },
      },
    };

    const type = getTestInterfaceType();

    runRoundTripTest(withComplexUnionType, type);
  });
});

function runRoundTripTest<T>(data: T, type: Type) {
  const witValue = constructWitValueFromTsValue(data, type);

  // Round trip wit-value -> value -> wit-value
  const value = constructValueFromWitValue(witValue);
  const witValueReturned = constructWitValueFromValue(value);
  expect(witValueReturned).toEqual(witValue);

  // Round trip ts-value -> wit-value -> ts-value
  const tsValueReturned = constructTsValueFromWitValue(witValueReturned, type);

  expect(tsValueReturned).toEqual(data);
}
