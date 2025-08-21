// Copyright 2024-2025 Golem Cloud
//
// Licensed under the Golem Source License v1.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://license.golem.cloud/LICENSE
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { TypeMetadata } from '../typeMetadata';
import { ClassType, Type } from 'rttist';
import { WasmRpc, WorkerId } from 'golem:rpc/types@0.2.2';
import { ComponentId, getSelfMetadata } from 'golem:api/host@1.1.7';
import * as Either from 'effect/Either';
import * as Value from './mapping/values/Value';
import * as WitValue from './mapping/values/WitValue';
import { AgentId } from '../agentId';
import * as AgentClassName from '../newTypes/AgentClassName';
import * as AgentTypeName from '../newTypes/AgentTypeName';
import * as Option from 'effect/Option';
import { getAgentType, RegisteredAgentType } from 'golem:agent/host';

export function getRemoteClient<T extends new (...args: any[]) => any>(
  ctor: T,
) {
  return (...args: any[]) => {
    const instance = new ctor(...args);

    const agentClassName = AgentClassName.fromString(ctor.name);
    const agentTypeName = AgentTypeName.fromAgentClassName(agentClassName);

    const metadataOpt = TypeMetadata.lookupClassMetadata(
      AgentClassName.fromString(ctor.name),
    );

    if (Option.isNone(metadataOpt)) {
      throw new Error(
        `Metadata for agent class ${ctor.name} not found. Make sure this agent class extends BaseAgent and is registered using @agent decorator`,
      );
    }

    const metadata = metadataOpt.value;

    const workerIdEither = initializeClient(agentClassName, args, metadata);

    if (Either.isLeft(workerIdEither)) {
      throw new Error(
        `Failed to initialize remote agent: ${workerIdEither.left}`,
      );
    }

    const workerId = workerIdEither.right;

    return new Proxy(instance, {
      get(target, prop) {
        const val = target[prop];

        if (typeof val === 'function') {
          return getMethodProxy(metadata, prop, agentTypeName, workerId);
        }
        return val;
      },
    });
  };
}

// Initialize client simply does a rpc-invoke on the initialize function of the remote agent
function initializeClient(
  agentClassName: AgentClassName.AgentClassName,
  constructorArgs: any[],
  classMetadata: Type,
): Either.Either<WorkerId, string> {
  const agentTypeName = AgentTypeName.fromAgentClassName(agentClassName);

  const workerIdEither = getWorkerId(agentTypeName, constructorArgs);

  if (Either.isLeft(workerIdEither)) {
    return Either.left(workerIdEither.left);
  }

  const workerId = workerIdEither.right;

  const rpc = new WasmRpc(workerId);

  const signature = (classMetadata as ClassType).getConstructors()[0];

  const constructorParamInfo = signature.getParameters();
  const constructorParamTypes = constructorParamInfo.map((param) => param.type);

  const constructorParamWitValuesResult = Either.all(
    constructorArgs.map((arg, index) => {
      const typ = constructorParamTypes[index];
      return WitValue.fromTsValue(arg, typ);
    }),
  );

  if (Either.isLeft(constructorParamWitValuesResult)) {
    throw new Error(
      'Failed to create remote agent: ' +
        JSON.stringify(constructorParamWitValuesResult.left),
    );
  }

  const agentTypeNameValue: Value.Value = {
    kind: 'string',
    value: agentTypeName,
  };

  let witValues = [
    Value.toWitValue(agentTypeNameValue),
    ...constructorParamWitValuesResult.right,
  ];

  const initResult = rpc.invokeAndAwait(`agent.{initialize}`, witValues);

  if (initResult.tag === 'err') {
    throw new Error(
      'Failed to initialize remote agent: ' + JSON.stringify(initResult.val),
    );
  }

  return Either.right(workerId);
}

function getMethodProxy(
  classMetadata: Type,
  prop: string | symbol,
  agentTypeName: AgentTypeName.AgentTypeName,
  workerId: WorkerId,
) {
  const methodSignature = (classMetadata as ClassType)
    .getMethod(prop)
    ?.getSignatures()[0]!;

  const paramInfo = methodSignature.getParameters();
  const returnType = methodSignature.returnType;

  return (...fnArgs: any[]) => {
    const functionName = `${agentTypeName}.{${prop.toString()}}`;

    const parameterWitValuesEither = Either.all(
      fnArgs.map((fnArg, index) => {
        const typ = paramInfo[index].type;
        return WitValue.fromTsValue(fnArg, typ);
      }),
    );

    const parameterWitValues = Either.isLeft(parameterWitValuesEither)
      ? (() => {
          throw new Error(
            'Failed to create remote agent: ' +
              JSON.stringify(parameterWitValuesEither.left),
          );
        })()
      : parameterWitValuesEither.right;

    const rpcForInvokeMethod = new WasmRpc(workerId);

    const rpcResult = rpcForInvokeMethod.invokeAndAwait(
      functionName,
      parameterWitValues,
    );

    const rpcWitValue =
      rpcResult.tag === 'err'
        ? (() => {
            throw new Error(
              'Failed to invoke function: ' + JSON.stringify(rpcResult.val),
            );
          })()
        : rpcResult.val;

    return WitValue.toTsValue(rpcWitValue, returnType);
  };
}

// constructorArgs is an array of any, we can have more control depending on its types
// Probably this implementation is going to exist in various forms in Golem. Not sure if there
// would be a way to reuse - may be a host function that retrieves the worker-id
// given value in JSON format, and the wit-type of each value and agent-type name?
function getWorkerId(
  agentTypeName: AgentTypeName.AgentTypeName,
  constructorArgs: any[],
): Either.Either<WorkerId, string> {
  // PlaceHolder implementation that finds the container-id corresponding to the agentType!
  // We need a host function - given an agent-type, it should return a component-id as proved in the prototype.
  // But we don't have that functionality yet, hence just retrieving the current
  // component-id (for now)
  const optionalRegisteredAgentType = Option.fromNullable(
    getAgentType(agentTypeName),
  );

  if (Option.isNone(optionalRegisteredAgentType)) {
    return Either.left(`There are no components implementing ${agentTypeName}`);
  }

  const registeredAgentType: RegisteredAgentType =
    optionalRegisteredAgentType.value;

  // AgentId is basically the container-name aka worker name, if the concept of "a container can have only one agent"
  const agentId = AgentId.fromAgentTypeAndParams(
    agentTypeName,
    constructorArgs,
  );

  return Either.right({
    componentId: registeredAgentType.implementedBy,
    workerName: agentId.value,
  });
}

function getWorkerName(value: Value.Value, componentId: ComponentId): WorkerId {
  if (value.kind === 'handle') {
    const parts = value.uri.split('/');
    const workerName = parts[parts.length - 1];
    if (!workerName) {
      throw new Error('Worker name not found in URI');
    }
    return { componentId, workerName };
  }

  throw new Error(
    `Expected value to be a handle, but got: ${JSON.stringify(value)}`,
  );
}
