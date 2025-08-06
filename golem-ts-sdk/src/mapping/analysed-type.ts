export interface NameTypePair {
  name: string;
  typ: AnalysedType;
}

export interface NameOptionTypePair {
  name: string;
  typ?: AnalysedType;
}

export type AnalysedType =
  | { kind: "variant"; value: TypeVariant }
  | { kind: "result"; value: TypeResult }
  | { kind: "option"; value: TypeOption }
  | { kind: "enum"; value: TypeEnum }
  | { kind: "flags"; value: TypeFlags }
  | { kind: "record"; value: TypeRecord }
  | { kind: "tuple"; value: TypeTuple }
  | { kind: "list"; value: TypeList }
  | { kind: "str" }
  | { kind: "chr" }
  | { kind: "f64" }
  | { kind: "f32" }
  | { kind: "u64" }
  | { kind: "s64" }
  | { kind: "u32" }
  | { kind: "s32" }
  | { kind: "u16" }
  | { kind: "s16" }
  | { kind: "u8" }
  | { kind: "s8" }
  | { kind: "bool" }
  | { kind: "handle"; value: TypeHandle };

export function getNameFromAnalysedType(typ: AnalysedType): string | undefined {
  switch (typ.kind) {
    case "variant":
      return typ.value.name;
    case "result":
      return typ.value.name;
    case "option":
      return typ.value.name;
    case "enum":
      return typ.value.name;
    case "flags":
      return typ.value.name;
    case "record":
      return typ.value.name;
    case "tuple":
      return typ.value.name;
    case "list":
      return typ.value.name;
    case "handle":
      return typ.value.name;
    default:
      return undefined;
  }
}

export function getOwnerFromAnalysedType(
  typ: AnalysedType,
): string | undefined {
  switch (typ.kind) {
    case "variant":
      return typ.value.owner;
    case "result":
      return typ.value.owner;
    case "option":
      return typ.value.owner;
    case "enum":
      return typ.value.owner;
    case "flags":
      return typ.value.owner;
    case "record":
      return typ.value.owner;
    case "tuple":
      return typ.value.owner;
    case "list":
      return typ.value.owner;
    case "handle":
      return typ.value.owner;
    default:
      return undefined;
  }
}

export interface TypeResult {
  name: string | undefined;
  owner: string | undefined;
  ok?: AnalysedType;
  err?: AnalysedType;
}

export interface TypeVariant {
  name: string | undefined;
  owner: string | undefined;
  cases: NameOptionTypePair[];
}

export interface TypeOption {
  name: string | undefined;
  owner: string | undefined;
  inner: AnalysedType;
}

export interface TypeEnum {
  name: string | undefined;
  owner: string | undefined;
  cases: string[];
}

export interface TypeFlags {
  name: string | undefined;
  owner: string | undefined;
  names: string[];
}

export interface TypeRecord {
  name: string | undefined;
  owner: string | undefined;
  fields: NameTypePair[];
}

export interface TypeTuple {
  name: string | undefined;
  owner: string | undefined;
  items: AnalysedType[];
}

export interface TypeList {
  name: string | undefined;
  owner: string | undefined;
  inner: AnalysedType;
}

export interface TypeHandle {
  name: string | undefined;
  owner: string | undefined;
  resourceId: AnalysedResourceId;
  mode: AnalysedResourceMode;
}

export type AnalysedResourceMode = "owned" | "borrowed";

export type AnalysedResourceId = number;

export const analysedType = {
  field: (name: string, typ: AnalysedType): NameTypePair => ({ name, typ }),

  case: (name: string, typ: AnalysedType): NameOptionTypePair => ({
    name,
    typ,
  }),
  optCase: (name: string, typ?: AnalysedType): NameOptionTypePair => ({
    name,
    typ,
  }),
  unitCase: (name: string): NameOptionTypePair => ({ name }),

  bool: (): AnalysedType => ({ kind: "bool" }),
  str: (): AnalysedType => ({ kind: "str" }),
  chr: (): AnalysedType => ({ kind: "chr" }),
  f64: (): AnalysedType => ({ kind: "f64" }),
  f32: (): AnalysedType => ({ kind: "f32" }),
  u64: (): AnalysedType => ({ kind: "u64" }),
  s64: (): AnalysedType => ({ kind: "s64" }),
  u32: (): AnalysedType => ({ kind: "u32" }),
  s32: (): AnalysedType => ({ kind: "s32" }),
  u16: (): AnalysedType => ({ kind: "u16" }),
  s16: (): AnalysedType => ({ kind: "s16" }),
  u8: (): AnalysedType => ({ kind: "u8" }),
  s8: (): AnalysedType => ({ kind: "s8" }),

  list: (inner: AnalysedType): AnalysedType => ({
    kind: "list",
    value: { name: undefined, owner: undefined, inner },
  }),
  option: (inner: AnalysedType): AnalysedType => ({
    kind: "option",
    value: { name: undefined, owner: undefined, inner },
  }),
  tuple: (items: AnalysedType[]): AnalysedType => ({
    kind: "tuple",
    value: { name: undefined, owner: undefined, items },
  }),
  record: (fields: NameTypePair[]): AnalysedType => ({
    kind: "record",
    value: { name: undefined, owner: undefined, fields },
  }),
  flags: (names: string[]): AnalysedType => ({
    kind: "flags",
    value: { name: undefined, owner: undefined, names },
  }),
  enum: (cases: string[]): AnalysedType => ({
    kind: "enum",
    value: { name: undefined, owner: undefined, cases },
  }),
  variant: (cases: NameOptionTypePair[]): AnalysedType => ({
    kind: "variant",
    value: { name: undefined, owner: undefined, cases },
  }),

  resultOk: (ok: AnalysedType): AnalysedType => ({
    kind: "result",
    value: { name: undefined, owner: undefined, ok },
  }),
  resultErr: (err: AnalysedType): AnalysedType => ({
    kind: "result",
    value: { name: undefined, owner: undefined, err },
  }),

  result: (ok: AnalysedType, err: AnalysedType): AnalysedType => ({
    kind: "result",
    value: { name: undefined, owner: undefined, ok, err },
  }),

  handle: (
    resourceId: AnalysedResourceId,
    mode: AnalysedResourceMode,
  ): AnalysedType => ({
    kind: "handle",
    value: { name: undefined, owner: undefined, resourceId, mode },
  }),
};
