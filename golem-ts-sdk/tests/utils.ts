import { PackageName } from '../src/typeMetadata';
import { Metadata } from '../src';
import { Type } from 'rttist';
import './setup';
import {
  AnalysedType,
  NameTypePair,
} from '../src/internal/mapping/types/AnalysedType';

export function getAll() {
  return Metadata.getTypes().filter(
    (type) => type.module.id == `@${PackageName}/tests/testData`,
  );
}

export function getTestInterfaceType(): Type {
  return fetchType('TestInterfaceType');
}

export function getTestMapType(): Type {
  return fetchType('MapType');
}

export function getTestObjectType(): Type {
  return fetchType('ObjectType');
}

export function getTestListType(): Type {
  return fetchType('ListType');
}

export function getTestListOfObjectType(): Type {
  return fetchType('ListComplexType');
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
  return fetchType('BooleanType');
}

export function getStringType(): Type {
  return fetchType('StringType');
}

export function getNumberType(): Type {
  return fetchType('NumberType');
}

export function getPromiseType(): Type {
  return fetchType('PromiseType');
}

export function getRecordFieldsFromAnalysedType(
  analysedType: AnalysedType,
): NameTypePair[] | undefined {
  return analysedType.kind === 'record' ? analysedType.value.fields : undefined;
}

function fetchType(typeNameInTestData: string): Type {
  const types = getAll().filter((type) => type.name == typeNameInTestData);

  if (types.length === 0) {
    throw new Error(`Type ${typeNameInTestData} not found in test data`);
  }
  return types[0];
}
