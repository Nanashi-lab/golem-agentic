import {GenericType, Type} from "rttist";

export function isInBuiltResult(type: Type): boolean {
    const genericType = type as GenericType<typeof type>;
    const typeDef = genericType.genericTypeDefinition;

    return typeDef.name === 'Result' && typeDef.id == '@@golemcloud/golem-ts-sdk/src/new-types:Result'
}

