import { ClassType, ParameterInfo, Type } from 'rttist';
import * as Either from 'effect/Either';
import { AgentMethod, DataSchema, ElementSchema } from 'golem:agent/common';
import { constructWitTypeFromTsType } from '../mapping/types/tsToWit';
import { AgentClassName } from '../AgentClassName';
import { MethodMetadata } from './methodMetadata';

export function getConstructorDataSchema(
  classType: Type,
): Either.Either<DataSchema, string> {
  const constructorInfos = (classType as ClassType).getConstructors();

  if (constructorInfos.length > 1) {
    throw new Error(
      `Agent type ${classType.name} has multiple constructors. Please specify the constructor parameters explicitly.`,
    );
  }

  const constructorSignatureInfo = constructorInfos[0];

  const constructorParamInfos: readonly ParameterInfo[] =
    constructorSignatureInfo.getParameters();

  const constructorParamTypes = Either.all(
    constructorParamInfos.map((paramInfo) =>
      constructWitTypeFromTsType(paramInfo.type),
    ),
  );

  const constructDataSchemaResult = Either.map(
    constructorParamTypes,
    (paramType) => {
      return paramType.map((paramType, idx) => {
        const paramName = constructorParamInfos[idx].name;
        return [
          paramName,
          {
            tag: 'component-model',
            val: paramType,
          },
        ] as [string, ElementSchema];
      });
    },
  );

  return Either.map(constructDataSchemaResult, (nameAndElementSchema) => {
    return {
      tag: 'tuple',
      val: nameAndElementSchema,
    };
  });
}

export function getAgentMethodSchema(
  classType: Type,
  agentClassName: AgentClassName,
): Either.Either<AgentMethod[], string> {
  let filteredType = classType as ClassType;
  let methodNames = filteredType.getMethods();

  return Either.all(
    methodNames.map((methodInfo) => {
      const signature = methodInfo.getSignatures()[0];

      const parameters = signature.getParameters();

      const returnType: Type = signature.returnType;

      const methodName = methodInfo.name.toString();

      const baseMeta =
        MethodMetadata.lookup(agentClassName)?.get(methodName) ?? {};

      const inputSchemaEither = buildInputSchema(parameters);

      if (Either.isLeft(inputSchemaEither)) {
        return Either.left(
          `Failed to construct input schema for method ${methodName}: ${inputSchemaEither.left}`,
        );
      }

      const inputSchema = inputSchemaEither.right;

      const outputSchemaEither = buildOutputSchema(returnType);

      if (Either.isLeft(outputSchemaEither)) {
        return Either.left(
          `Failed to construct output schema for method ${methodName}: ${outputSchemaEither.left}`,
        );
      }

      const outputSchema = outputSchemaEither.right;

      return Either.right({
        name: methodName,
        description: baseMeta.description ?? '',
        promptHint: baseMeta.prompt ?? '',
        inputSchema: inputSchema,
        outputSchema: outputSchema,
      });
    }),
  );
}

export function buildInputSchema(
  paramTypes: readonly ParameterInfo[],
): Either.Either<DataSchema, string> {
  const result = Either.all(
    paramTypes.map((parameterInfo) =>
      Either.map(convertToElementSchema(parameterInfo.type), (result) => {
        return [parameterInfo.name, result] as [string, ElementSchema];
      }),
    ),
  );

  return Either.map(result, (res) => {
    return {
      tag: 'tuple',
      val: res,
    };
  });
}

export function buildOutputSchema(
  returnType: Type,
): Either.Either<DataSchema, string> {
  return Either.map(convertToElementSchema(returnType), (result) => {
    return {
      tag: 'tuple',
      val: [['return-value', result]],
    };
  });
}

function convertToElementSchema(
  type: Type,
): Either.Either<ElementSchema, string> {
  return Either.map(constructWitTypeFromTsType(type), (witType) => {
    return {
      tag: 'component-model',
      val: witType,
    };
  });
}
