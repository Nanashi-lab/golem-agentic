import { Type } from './ts-morph-shim';

type ClassNameString = string;
type MethodNameString = string;

export type MethodParams = Map<string, Type>;

export type ReturnType = Type;

export type ConstructorArg = { name: string; type: Type };

export type ClassMetadata = {
  constructorArgs: ConstructorArg[];
  methods: Map<
    MethodNameString,
    { methodParams: MethodParams; returnType: Type }
  >;
};

const Metadata = new Map<ClassNameString, ClassMetadata>();

export const TypeMetadata = {
  update(
    className: ClassNameString,
    constructorArgs: ConstructorArg[],
    methods: Map<
      MethodNameString,
      { methodParams: MethodParams; returnType: Type }
    >,
  ) {
    Metadata.set(className, { constructorArgs, methods });
  },

  get(className: string): ClassMetadata | undefined {
    return Metadata.get(className);
  },

  getAll(): Map<ClassNameString, ClassMetadata> {
    return Metadata;
  },
};
