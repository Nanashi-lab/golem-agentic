import {Type} from "rttist";

export function isInBuiltResult(type: Type): boolean {
    return type.name.startsWith("@golemcloud/golem-ts-sdk") &&
        type.name.endsWith('Either<\'2>');
}

