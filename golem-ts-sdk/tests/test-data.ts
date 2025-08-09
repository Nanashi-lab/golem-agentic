// DO NOT RENAME INTERFACES OR PROPERTIES.
// These names are introspected using RTTIST metadata reflection
// and are used in unit tests.

// These interfaces define the set of TypeScript types that are officially
// supported and guaranteed by the SDK’s type mapping layer.

// Whatever you add here will be tested automatically in the unit test with no further change.
// This will at least ensure the mapping layer does not break for these types.
// However, you can/should explicitly test the behavior of a specific type by adding necessary utility
// functions in type-utils.ts in tests module.

// ─────────────────────────────────────────────────────────────────────────────

interface SimpleInterfaceType {
  n: number;
}

export type ObjectType = { a: string; b: number; c: boolean };

export type UnionType = number | string | boolean | ObjectType;

export type ListType = Array<string>;

export type ListComplexType = Array<ObjectType>;

export type TupleType = [string, number, boolean];

export type TupleComplexType = [string, number, ObjectType];

export type MapType = Map<string, number>;

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
