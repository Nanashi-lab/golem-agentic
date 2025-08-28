export type LiteTypeJSON =
  | { kind: 'boolean'; name?: 'boolean' | 'true' | 'false' }
  | { kind: 'number'; name?: 'number' }
  | { kind: 'string'; name?: 'string' }
  | { kind: 'bigint'; name?: 'bigint' }
  | { kind: 'null'; name?: 'null' }
  | { kind: 'undefined'; name?: 'undefined' }
  | { kind: 'array'; name?: string; element: LiteTypeJSON }
  | { kind: 'tuple'; name?: string; elements: LiteTypeJSON[] }
  | { kind: 'union'; name?: string; types: LiteTypeJSON[] }
  | {
      kind: 'object';
      name?: string;
      properties: Array<{
        name: string;
        type: LiteTypeJSON;
        optional?: boolean;
      }>;
    }
  | {
      kind: 'interface';
      name?: string;
      properties: Array<{
        name: string;
        type: LiteTypeJSON;
        optional?: boolean;
      }>;
    }
  | {
      kind: 'custom';
      name: string;
      typeArgs?: LiteTypeJSON[];
    }
  | {
      kind: 'alias';
      name: string;
      target: LiteTypeJSON;
    };



type NodeKind = 'PropertySignature' | 'PropertyDeclaration' | 'TypeAlias';

export class Node {
  private readonly _kind: NodeKind;
  private readonly _optional: boolean;

  constructor(kind: NodeKind, optional = false) {
    this._kind = kind;
    this._optional = optional;
  }

  getText(): string {
    return this._kind;
  }

  hasQuestionToken(): boolean {
    return this._optional;
  }

  static isPropertySignature(node: Node): boolean {
    return node._kind === 'PropertySignature';
  }

  static isPropertyDeclaration(node: Node): boolean {
    return node._kind === 'PropertyDeclaration';
  }

  _getKind(): NodeKind {
    return this._kind;
  }
}

export class Symbol {
  private readonly name: string;
  private readonly decls: Node[];
  private readonly valueDecl?: Node;
  private readonly _typeAtLocation: Type;
  private readonly _aliasTarget?: Type;

  constructor(args: {
    name: string;
    declarations: Node[];
    typeAtLocation?: Type;
    valueDeclaration?: Node;
    aliasTarget?: Type;
  }) {
    this.name = args.name;
    this.decls = args.declarations;
    this.valueDecl = args.valueDeclaration ?? args.declarations[0];
    this._typeAtLocation =
      args.typeAtLocation ?? new Type({ kind: 'undefined', name: 'undefined' });
    this._aliasTarget = args.aliasTarget;
  }

  getName(): string {
    return this.name;
  }

  getDeclarations(): Node[] {
    return this.decls;
  }

  getValueDeclarationOrThrow(): Node {
    if (!this.valueDecl) throw new Error('No value declaration');
    return this.valueDecl;
  }


  getTypeAtLocation(_node: Node): Type {
    return this._typeAtLocation;
  }


  _getAliasTarget(): Type | undefined {
    return this._aliasTarget;
  }
}

type Kind =
  | 'boolean'
  | 'number'
  | 'string'
  | 'bigint'
  | 'null'
  | 'undefined'
  | 'array'
  | 'tuple'
  | 'union'
  | 'object'
  | 'interface'
  | 'custom'
  | 'alias';

export class Type {

  public readonly compilerType: unknown = undefined;

  private readonly kind: Kind;
  private readonly name?: string;
  private readonly element?: Type;
  private readonly elements?: Type[];
  private readonly unionTypes?: Type[];
  private readonly properties?: Symbol[];
  private readonly typeArgs?: Type[];
  private readonly aliasSymbol?: Symbol;

  constructor(from: {
    kind: Kind;
    name?: string;
    element?: Type;
    elements?: Type[];
    unionTypes?: Type[];
    properties?: Symbol[];
    typeArgs?: Type[];
    aliasSymbol?: Symbol;
  }) {
    this.kind = from.kind;
    this.name = from.name;
    this.element = from.element;
    this.elements = from.elements;
    this.unionTypes = from.unionTypes;
    this.properties = from.properties;
    this.typeArgs = from.typeArgs;
    this.aliasSymbol = from.aliasSymbol;
  }

  getName(): string | undefined {
    return this.name;
  }

  getTypeArguments(): Type[] {
    return this.typeArgs ?? [];
  }

  isBoolean(): boolean {
    return this.kind === 'boolean';
  }

  isTuple(): boolean {
    return this.kind === 'tuple';
  }
  getTupleElements(): Type[] {
    return this.elements ?? [];
  }

  isArray(): boolean {
    return this.kind === 'array';
  }
  getArrayElementType(): Type | undefined {
    return this.element;
  }

  isUnion(): boolean {
    return this.kind === 'union';
  }
  getUnionTypes(): Type[] {
    return this.unionTypes ?? [];
  }

  isObject(): boolean {
    return this.kind === 'object';
  }
  isInterface(): boolean {
    return this.kind === 'interface';
  }
  getProperties(): Symbol[] {
    return this.properties ?? [];
  }

  isNull(): boolean {
    return this.kind === 'null';
  }
  isBigInt(): boolean {
    return this.kind === 'bigint';
  }
  isUndefined(): boolean {
    return this.kind === 'undefined';
  }
  isNumber(): boolean {
    return this.kind === 'number';
  }
  isString(): boolean {
    return this.kind === 'string';
  }

  getAliasSymbol(): Symbol | undefined {
    return this.aliasSymbol;
  }
}

export function buildTypeFromJSON(json: LiteTypeJSON): Type {
  switch (json.kind) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'bigint':
    case 'null':
    case 'undefined':
      return new Type({ kind: json.kind, name: json.name });

    case 'array': {
      const elem = buildTypeFromJSON(json.element);
      return new Type({
        kind: 'array',
        name: json.name ?? 'Array',
        element: elem,
      });
    }

    case 'tuple': {
      const elems = json.elements.map(buildTypeFromJSON);
      return new Type({
        kind: 'tuple',
        name: json.name ?? 'Tuple',
        elements: elems,
      });
    }

    case 'union': {
      const types = json.types.map(buildTypeFromJSON);
      return new Type({
        kind: 'union',
        name: json.name ?? 'Union',
        unionTypes: types,
      });
    }

    case 'object': {
      const props = json.properties.map(
        (p) =>
          new Symbol({
            name: p.name,
            declarations: [new Node('PropertySignature', !!p.optional)],
            typeAtLocation: buildTypeFromJSON(p.type),
          }),
      );
      return new Type({
        kind: 'object',
        name: json.name ?? 'Object',
        properties: props,
      });
    }

    case 'interface': {
      const props = json.properties.map(
        (p) =>
          new Symbol({
            name: p.name,
            declarations: [new Node('PropertyDeclaration', !!p.optional)],
            typeAtLocation: buildTypeFromJSON(p.type),
          }),
      );
      return new Type({
        kind: 'interface',
        name: json.name ?? 'Interface',
        properties: props,
      });
    }

    case 'custom': {
      const args = (json.typeArgs ?? []).map(buildTypeFromJSON);
      return new Type({ kind: 'custom', name: json.name, typeArgs: args });
    }

    case 'alias': {
      const target = buildTypeFromJSON(json.target);
      const aliasDecl = new Node('TypeAlias', false);
      const aliasSym = new Symbol({
        name: json.name,
        declarations: [aliasDecl],
        aliasTarget: target,
      });
      return new Type({
        kind: 'alias',
        name: json.name,
        aliasSymbol: aliasSym,
      });
    }
  }
}

export function getTypeName(t: Type): string {
  if (t.getName) return t.getName()!;
  if (t.isArray()) return 'Array';
  if (t.isTuple()) return 'Tuple';
  if (t.isUnion()) return 'Union';
  if (t.isObject()) return 'Object';
  if (t.isInterface()) return 'Interface';
  if (t.isBoolean()) return 'boolean';
  if (t.isNumber()) return 'number';
  if (t.isString()) return 'string';
  if (t.isNull()) return 'null';
  if (t.isUndefined()) return 'undefined';
  if (t.isBigInt()) return 'bigint';
  return 'unknown';
}

export function unwrapAlias(t: Type): Type {
  let current = t;
  const seen = new Set<Type>();
  while (true) {
    const alias = current.getAliasSymbol();
    if (!alias || seen.has(current)) break;
    seen.add(current);

    const decl = alias.getDeclarations()[0];
    if (!decl) break;


    const target = (alias as any)._getAliasTarget?.() as Type | undefined;
    if (!target || target === current) break;

    current = target;
  }
  return current;
}
