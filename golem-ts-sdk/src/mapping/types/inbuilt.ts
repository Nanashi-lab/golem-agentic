import {GenericType, Type} from "rttist";

export function isInBuiltResult(type: Type): boolean {
    const genericType = type as GenericType<typeof type>;
    const typeDef = genericType.genericTypeDefinition;

    return typeDef.name === 'Either' && typeDef.id.startsWith("@@golemcloud/golem-ts-sdk")
}

