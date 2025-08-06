import {
  AnalysedType,
  getNameFromAnalysedType,
  getOwnerFromAnalysedType,
  NameOptionTypePair,
  NameTypePair,
} from "./analysed-type";
import {
  NamedWitTypeNode,
  NodeIndex,
  ResourceMode,
  WitTypeNode,
} from "golem:rpc/types@0.2.2";
import { WitType } from "golem:agent/common";
import { Type } from "rttist";
import { InterfaceType, ObjectType, Type as TsType, TypeKind } from "rttist";
import { analysedType } from "./analysed-type";

export function constructWitTypeFromTsType(type: Type): WitType {
  const analysedType = analysedTypeFromType(type);
  return constructFromAnalysedType(analysedType);
}

function constructFromAnalysedType(typ: AnalysedType): WitType {
  const builder = new WitTypeBuilder();
  builder.add(typ);
  return builder.build();
}

// Copied from wasm-rpc rust implementation
class WitTypeBuilder {
  private nodes: NamedWitTypeNode[] = [];
  private mapping = new Map<string, number>();

  add(typ: AnalysedType): NodeIndex {
    const hash = JSON.stringify(typ);
    if (this.mapping.has(hash)) {
      return this.mapping.get(hash)!;
    }

    const idx = this.nodes.length;
    const boolType: WitTypeNode = { tag: "prim-bool-type" };
    this.nodes.push({ name: undefined, owner: undefined, type: boolType });

    const node: WitTypeNode = this.convert(typ);
    const name = getNameFromAnalysedType(typ);
    const owner = getOwnerFromAnalysedType(typ);
    this.nodes[idx] = { name, owner, type: node };
    this.mapping.set(hash, idx);
    return idx;
  }

  build(): WitType {
    return { nodes: this.nodes };
  }

  private convert(typ: AnalysedType): WitTypeNode {
    switch (typ.kind) {
      case "variant": {
        const cases: [string, NodeIndex | undefined][] = typ.value.cases.map(
          (c: NameOptionTypePair) => [
            c.name,
            c.typ ? this.add(c.typ) : undefined,
          ],
        );
        return { tag: "variant-type", val: cases };
      }

      case "result": {
        const ok = typ.value.ok ? this.add(typ.value.ok) : undefined;
        const err = typ.value.err ? this.add(typ.value.err) : undefined;
        return { tag: "result-type", val: [ok, err] };
      }

      case "option": {
        const inner = this.add(typ.value.inner);
        return { tag: "option-type", val: inner };
      }

      case "enum":
        return { tag: "enum-type", val: typ.value.cases };

      case "flags":
        return { tag: "flags-type", val: typ.value.names };

      case "record": {
        const fields: [string, NodeIndex][] = typ.value.fields.map(
          (f: NameTypePair) => [f.name, this.add(f.typ)],
        );
        return { tag: "record-type", val: fields };
      }

      case "tuple": {
        const elements = typ.value.items.map((item) => this.add(item));
        return { tag: "tuple-type", val: elements };
      }

      case "list": {
        const inner = this.add(typ.value.inner);
        return { tag: "list-type", val: inner };
      }

      case "str":
        return { tag: "prim-string-type" };
      case "chr":
        return { tag: "prim-char-type" };
      case "f64":
        return { tag: "prim-f64-type" };
      case "f32":
        return { tag: "prim-f32-type" };
      case "u64":
        return { tag: "prim-u64-type" };
      case "s64":
        return { tag: "prim-s64-type" };
      case "u32":
        return { tag: "prim-u32-type" };
      case "s32":
        return { tag: "prim-s32-type" };
      case "u16":
        return { tag: "prim-u16-type" };
      case "s16":
        return { tag: "prim-s16-type" };
      case "u8":
        return { tag: "prim-u8-type" };
      case "s8":
        return { tag: "prim-s8-type" };
      case "bool":
        return { tag: "prim-bool-type" };

      // FIXME: Why? typ.value.resourceId is a number and the handle-type takes a bigint
      case "handle": {
        const resId: number = typ.value.resourceId;
        const mode: ResourceMode =
          typ.value.mode === "owned" ? "owned" : "borrowed";
        return { tag: "handle-type", val: [BigInt(resId), mode] };
      }

      default:
        throw new Error(`Unhandled AnalysedType kind: ${(typ as any).kind}`);
    }
  }
}

function analysedTypeFromType(type: TsType): AnalysedType {
  switch (type.kind) {
    case TypeKind.Intrinsic:
    case TypeKind.False:
      return analysedType.bool();
    case TypeKind.True:
      return analysedType.bool();
    case TypeKind.DataView:
      return analysedType.list(analysedType.u8());
    case TypeKind.MapDefinition:
      const mapKeyType = type.getTypeArguments?.()[0];
      const mapValueType = type.getTypeArguments?.()[1];
      const key = analysedTypeFromType(mapKeyType);
      const value = analysedTypeFromType(mapValueType);
      return analysedType.list(analysedType.tuple([key, value]));

    case TypeKind.WeakMapDefinition:
      const weakMapKeyType = type.getTypeArguments?.()[0];
      const weakMapValueType = type.getTypeArguments?.()[1];
      const weakKey = analysedTypeFromType(weakMapKeyType);
      const weakValue = analysedTypeFromType(weakMapValueType);
      return analysedType.list(analysedType.tuple([weakKey, weakValue]));

    case TypeKind.SetDefinition:
    case TypeKind.WeakSetDefinition:
      const setType = type.getTypeArguments?.()[0];
      if (!setType) {
        throw new Error("Set must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(setType));

    case TypeKind.GeneratorDefinition:
      const genType = type.getTypeArguments?.()[0];
      if (!genType) {
        throw new Error("Generator must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(genType));
    case TypeKind.AsyncGeneratorDefinition:
      const generatorType = type.getTypeArguments?.()[0];
      if (!generatorType) {
        throw new Error("Generator must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(generatorType));

    case TypeKind.IteratorDefinition:
      const iteratorType = type.getTypeArguments?.()[0];
      if (!iteratorType) {
        throw new Error("Iterator must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(iteratorType));
    case TypeKind.IterableDefinition:
      const iterableType = type.getTypeArguments?.()[0];
      if (!iterableType) {
        throw new Error("Iterable must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(iterableType));
    case TypeKind.IterableIteratorDefinition:
      const iterableIteratorType = type.getTypeArguments?.()[0];
      if (!iterableIteratorType) {
        throw new Error("IterableIterator must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(iterableIteratorType));
    case TypeKind.AsyncIteratorDefinition:
      const asyncIteratorType = type.getTypeArguments?.()[0];
      if (!asyncIteratorType) {
        throw new Error("AsyncIterator must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(asyncIteratorType));
    case TypeKind.AsyncIterableDefinition:
      const asyncIterableType = type.getTypeArguments?.()[0];
      if (!asyncIterableType) {
        throw new Error("AsyncIterable must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(asyncIterableType));
    case TypeKind.AsyncIterableIteratorDefinition:
      const asyncIterableIteratorType = type.getTypeArguments?.()[0];
      if (!asyncIterableIteratorType) {
        throw new Error("AsyncIterableIterator must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(asyncIterableIteratorType));

    case TypeKind.Type:
      const arg = type.getTypeArguments?.()[0];
      if (!arg) {
        throw new Error("Type must have a type argument");
      }

      return analysedTypeFromType(arg);

    // To be handled
    case TypeKind.Module:
    case TypeKind.Namespace:
    case TypeKind.Object:
    case TypeKind.Interface:
      const objectInterface = type as InterfaceType;
      const interfaceFields = objectInterface.getProperties().map((prop) => {
        return analysedType.field(
          prop.name.toString(),
          analysedTypeFromType(prop.type),
        );
      });
      return analysedType.record(interfaceFields);

    case TypeKind.Class:
    case TypeKind.Union:
    case TypeKind.TemplateLiteral:
    case TypeKind.Intersection:
    case TypeKind.ConditionalType:
    case TypeKind.IndexedAccess:
    case TypeKind.TypeParameter:
    case TypeKind.Alias:
    case TypeKind.Method:
    case TypeKind.Function:
    case TypeKind.GeneratorFunction:
    case TypeKind.EnumLiteral:
    case TypeKind.RegExpLiteral:
    case TypeKind.Enum:
    case TypeKind.UniqueSymbol:
    case TypeKind.ESSymbol:
    case TypeKind.Generator:
    case TypeKind.AsyncGenerator:
    case TypeKind.Iterator:
    case TypeKind.Iterable:
    case TypeKind.IterableIterator:
    case TypeKind.AsyncIterator:
    case TypeKind.AsyncIterable:
    case TypeKind.AsyncIterableIterator:
    case TypeKind.Jsx:
    case TypeKind.TypeCtor:
    case TypeKind.Unknown:
    case TypeKind.Any:
    case TypeKind.Never:
    case TypeKind.Void:
      throw new TypeError("unsupported type in Golem " + type.kind);

    case TypeKind.Undefined:
      throw new TypeError("undefined type is not supported in Golem");

    case TypeKind.Null:
      return analysedType.option(analysedType.str());

    case TypeKind.Boolean:
      return analysedType.bool();

    case TypeKind.BigInt:
    case TypeKind.Float64Array:
      return analysedType.f64();

    case TypeKind.Number:
      return analysedType.s32(); // For the same reason - as an example - Rust defaults to i32

    case TypeKind.String:
      return analysedType.str();

    case TypeKind.Symbol:
    case TypeKind.NonPrimitiveObject:
    case TypeKind.FunctionType:
    case TypeKind.Atomics:
      throw new TypeError("type is not supported in Golem");

    case TypeKind.Date:
    case TypeKind.RegExp:
      return analysedType.str();

    case TypeKind.Error:
      return analysedType.resultErr(analysedType.str());

    case TypeKind.Int8Array:
      return analysedType.list(analysedType.s8());

    case TypeKind.Uint8Array:
    case TypeKind.Uint8ClampedArray:
    case TypeKind.ArrayBuffer:
    case TypeKind.SharedArrayBuffer:
      return analysedType.list(analysedType.u8());

    case TypeKind.Int16Array:
      return analysedType.list(analysedType.s16());

    case TypeKind.Uint16Array:
      return analysedType.list(analysedType.u16());

    case TypeKind.Int32Array:
      return analysedType.list(analysedType.s32());

    case TypeKind.Uint32Array:
      return analysedType.list(analysedType.u32());

    case TypeKind.Float32Array:
      return analysedType.list(analysedType.f32());

    case TypeKind.BigInt64Array:
      return analysedType.list(analysedType.s64());

    case TypeKind.BigUint64Array:
      return analysedType.list(analysedType.u64());

    case TypeKind.Invalid:
      const typeArgument = type.getTypeArguments?.()[0];
      if (!typeArgument) {
        throw new Error("Promise must have a type argument");
      }
      return analysedTypeFromType(typeArgument);

    case TypeKind.NumberLiteral:
      return analysedType.f64();
    case TypeKind.BigIntLiteral:
      return analysedType.s64();
    case TypeKind.StringLiteral:
      return analysedType.str();

    case TypeKind.Promise:
      const promiseType = type.getTypeArguments?.()[0];
      if (!promiseType) {
        throw new Error("Promise must have a type argument");
      }

      return analysedTypeFromType(promiseType);

    case TypeKind.PromiseDefinition:
      const promiseDefType = type.getTypeArguments?.()[0];

      if (!promiseDefType) {
        throw new Error("PromiseDefinition must have a type argument");
      }

      return analysedType.option(analysedTypeFromType(promiseDefType));

    case TypeKind.ObjectType:
      const obj = type as ObjectType;
      const fields = obj.getProperties().map((prop) => {
        return analysedType.field(
          prop.name.toString(),
          analysedTypeFromType(prop.type),
        );
      });
      return analysedType.record(fields);

    case TypeKind.TupleDefinition:
      const tupleTypes =
        type.getTypeArguments?.().map(analysedTypeFromType) || [];
      return analysedType.tuple(tupleTypes);

    case TypeKind.ArrayDefinition:
    case TypeKind.ReadonlyArrayDefinition:
      const elementType = type.getTypeArguments?.()[0];
      if (!elementType) {
        throw new Error("Array must have a type argument");
      }
      return analysedType.list(analysedTypeFromType(elementType));
  }
}
