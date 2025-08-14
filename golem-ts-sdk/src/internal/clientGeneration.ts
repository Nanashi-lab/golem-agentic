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

import { Metadata, TypeMetadata } from '../typeMetadata';
import { ClassType } from 'rttist';
import { WasmRpc, WitValue, WorkerId } from 'golem:rpc/types@0.2.2';
import { ComponentId, getSelfMetadata } from 'golem:api/host@1.1.7';
import { DataValue } from 'golem:agent/common';
import { constructWitValueFromTsValue } from './mapping/values/ts-to-wit';
import { constructTsValueFromWitValue } from './mapping/values/wit-to-ts';
import * as Either from 'effect/Either';
import * as Option from 'effect/Option';
import * as AgentClassName from '../newTypes/AgentClassName';
import * as AgentName from '../newTypes/AgentName';
import * as Value from './mapping/values/Value';
import { AgentInitiatorRegistry } from './registry/agentInitiatorRegistry';

export function getLocalClient<T extends new (...args: any[]) => any>(ctor: T) {
  return (...args: any[]) => {
    const agentClassName = AgentClassName.fromString(ctor.name);

    const agentInitiator = Option.getOrThrowWith(
      AgentInitiatorRegistry.lookup(
        AgentName.fromAgentClassName(agentClassName),
      ),
      () => {
        new Error(
          `Failed to find agent initiator for agent class: ${agentClassName}`,
        );
      },
    );

    const classMetadata = Option.getOrThrowWith(
      TypeMetadata.lookupClassMetadata(agentClassName),
      () => {
        new Error(`Failed to find metadata for agent class: ${agentClassName}`);
      },
    );

    const constructor = (classMetadata as ClassType).getConstructors()[0];

    const parameters = constructor.getParameters();

    const parameterWitValuesResult = Either.all(
      args.map((fnArg, index) => {
        const typ = parameters[index].type;
        return constructWitValueFromTsValue(fnArg, typ);
      }),
    );

    // There is no big advantage of returning a Result here,
    // and gives bad experience to the users:
    // `MyAgent.createLocal` should just give a normal error.
    // If they want to handle errors, they can use `Either` or `Result` or try-catch.
    const parameterWitValues = Either.isLeft(parameterWitValuesResult)
      ? (() => {
          throw new Error(
            'Failed to create a local agent' +
              JSON.stringify(parameterWitValuesResult.left),
          );
        })()
      : parameterWitValuesResult.right;

    // Currently handling only wit value
    const dataValue: DataValue = {
      tag: 'tuple',
      val: parameterWitValues.map((param) => {
        return {
          tag: 'component-model',
          val: param,
        };
      }),
    };

    // We ensure to create every agent using agentInitiator
    const resolvedAgent = agentInitiator.initiate(agentClassName, dataValue);

    if (resolvedAgent.tag === 'err') {
      throw new Error(
        'Failed to create agent: ' + JSON.stringify(resolvedAgent.val),
      );
    } else {
      const instance = resolvedAgent.val.classInstance;

      return new Proxy(instance, {
        get(target, prop) {
          const val = target[prop];
          if (typeof val === 'function') {
            return (...fnArgs: any[]) => {
              return val.apply(target, fnArgs);
            };
          }
          return val;
        },
      });
    }
  };
}

export function getRemoteClient<T extends new (...args: any[]) => any>(
  ctor: T,
) {
  return (...args: any[]) => {
    const instance = new ctor(...args);
    const metadata = Metadata.getTypes().filter(
      (type) => type.isClass() && type.name === ctor.name,
    )[0];

    // getAgentComponent in code_first branch to be implemented
    // until then using self metadata
    const componentId: ComponentId = getSelfMetadata().workerId.componentId;

    const rpc = WasmRpc.ephemeral(componentId);

    const result = rpc.invokeAndAwait(
      'golem:simulated-agentic-typescript/simulated-agent-ts.{weather-agent.new}',
      [],
    );

    const resourceWitValues =
      result.tag === 'err'
        ? (() => {
            throw new Error(
              'Failed to create resource: ' +
                JSON.stringify(result.val) +
                ' ' +
                JSON.stringify(componentId) +
                ' should be the same as ' +
                JSON.stringify(componentId),
            );
          })()
        : result.val;

    const resourceValue = Value.fromWitValue(resourceWitValues);

    const resourceVal = (() => {
      switch (resourceValue.kind) {
        case 'tuple':
          return resourceValue.value[0];
        default:
          throw new Error('Unsupported kind: ' + resourceValue.kind);
      }
    })();

    const workerId = getWorkerName(resourceVal, componentId);

    const resourceWitValue = Value.toWitValue(resourceVal);

    return new Proxy(instance, {
      get(target, prop) {
        const val = target[prop];

        if (typeof val === 'function') {
          const signature = (metadata as ClassType)
            .getMethod(prop)
            ?.getSignatures()[0]!;

          const paramInfo = signature.getParameters();
          const returnType = signature.returnType;

          return (...fnArgs: any[]) => {
            const functionName = `golem:simulated-agentic-typescript/simulated-agent.{[method]{${ctor.name}.{${prop.toString()}}`;

            const parameterWitValuesResult = Either.all(
              fnArgs.map((fnArg, index) => {
                const typ = paramInfo[index].type;
                return constructWitValueFromTsValue(fnArg, typ);
              }),
            );

            // There is no big advantage of returning a Result here,
            // and gives bad experience to the users:
            // `MyAgent.createRemote` should just give a normal error.
            // If they want to handle errors, they can use `Either` or `Result`
            // or try-catch.
            const parameterWitValues = Either.isLeft(parameterWitValuesResult)
              ? (() => {
                  throw new Error(
                    'Failed to create remote agent: ' +
                      JSON.stringify(parameterWitValuesResult.left),
                  );
                })()
              : parameterWitValuesResult.right;

            const inputArgs: WitValue[] = [
              resourceWitValue,
              ...parameterWitValues,
            ];
            const invokeRpc = new WasmRpc(workerId);
            const rpcResult = invokeRpc.invokeAndAwait(functionName, inputArgs);
            const rpcWitValue =
              rpcResult.tag === 'err'
                ? (() => {
                    throw new Error(
                      'Failed to invoke function: ' +
                        JSON.stringify(result.val),
                    );
                  })()
                : result.val;

            return constructTsValueFromWitValue(rpcWitValue, returnType);
          };
        }
        return val;
      },
    });
  };
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
