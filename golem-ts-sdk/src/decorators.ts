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

import { AgentType, DataValue, AgentError } from 'golem:agent/common';
import { WitValue } from 'golem:rpc/types@0.2.2';
import { AgentInternal } from './internal/agentInternal';
import { ResolvedAgent } from './internal/resolvedAgent';
import { TypeMetadata } from './typeMetadata';
import { ClassType, ParameterInfo, Type } from 'rttist';
import { getLocalClient, getRemoteClient } from './internal/clientGeneration';
import { BaseAgent } from './baseAgent';
import { AgentInitiatorRegistry } from './internal/agentInitiator';
import { createUniqueAgentId } from './agent-instance-counter';
import { AgentRegistry } from './internal/agentRegistry';
import { constructTsValueFromWitValue } from './internal/mapping/values/wit-to-ts';
import { constructWitValueFromTsValue } from './internal/mapping/values/ts-to-wit';
import * as Either from 'effect/Either';
import {
  getAgentMethodSchema,
  getConstructorDataSchema,
} from './internal/schema';
import * as Option from 'effect/Option';
import { MethodMetadata } from './internal/methodMetadata';
import * as AgentClassName from './AgentClassName';
import * as AgentName from './AgentName';

/**
 * Marks a class as an Agent and registers it in the global agent registry.
 * Note that the method generates a `local` and `remote` client for the agent.
 * The details of these clients are explained further below.
 *
 * The `@agent()` decorator:
 * - Registers the agent type for discovery by other agents.
 * - Inspects the constructor to determine its parameter types.
 * - Inspects all methods to determine their input/output parameter types.
 * - Associates metadata such as `prompt` and `description` with the agent.
 * - Creates `.createLocal()` and `.createRemote()` factory methods on the class.
 * - Enables schema-based validation of parameters and return values.
 *
 * ### Naming
 * By default, the agent name is the kebab-case of the class name.
 * Example:
 * ```ts
 * @agent()
 * class WeatherAgent {} // -> "weather-agent"
 * ```
 * You can override the name using explicit metadata.
 *
 * ### Metadata
 * Prompt and description are **recommended** so that other agents can decide whether to interact with this agent.
 * ```ts
 * @prompt("Provide a city name")
 * @description("Get the current weather for a location")
 * getWeather(city: string): Promise<WeatherResult> { ... }
 * ```
 *
 * ### Agent parameter types
 *
 * Please note that there are a few limitations in what can be types of these parameters.
 * Please read through the documentation that list the types that are currently supported.
 *
 * - Constructor and method parameters can be any valid TypeScript type.
 * - **Enums are not supported**.
 * - Use **type aliases** for clarity and reusability.
 * ```ts
 * type Coordinates = { lat: number; lon: number };
 * type WeatherReport = { temperature: number; description: string };
 *
 * @agent()
 * class WeatherAgent {
 *   constructor(apiKey: string) {}
 *
 *   getWeather(coords: Coordinates): WeatherReport { ... }
 * }
 * ```
 *
 * ### Example
 *
 * ```ts
 * @agent()
 * class CalculatorAgent {
 *   constructor(baseValue: number) {}
 *
 *   add(value: number): number {
 *     return this.baseValue + value;
 *   }
 * }
 *
 * ### Remote and Local Clients
 *
 * A local client is a direct instance of the agent class,
 * which can be used to call methods directly. It is recommended to use the local clients
 * even if you can create a local client by directly calling the constructor.
 *
 * With a local client, any logic defined in the agent class is executed in the same container.
 *
 * const calc = CalculatorAgent.createLocal(10);
 * console.log(calc.add(5)); // 15
 *
 * The purpose of a remote client is that it allows you to invoke the agent constructor
 * and methods of an agent (even if it's defined with in the same code) in a different container.
 * An immediate outcome of this is that you are offloading the work of this agent to a different container
 * than the current container.
 *
 * const calcRemote = CalculatorAgent.createRemote();
 * calcRemote.add(5);
 * ```
 */
export function agent() {
  return function <T extends new (...args: any[]) => any>(ctor: T) {
    const agentClassName = AgentClassName.fromString(ctor.name);

    if (AgentRegistry.exists(agentClassName)) {
      return ctor;
    }

    let classType = Option.getOrElse(
      TypeMetadata.lookupClassMetadata(agentClassName),
      () => {
        throw new Error(
          `Agent class ${agentClassName} is not registered in TypeMetadata. Please ensure the class is decorated with @agent()`,
        );
      },
    );

    const constructorDataSchema = Either.getOrElse(
      getConstructorDataSchema(classType),
      (err) => {
        throw new Error('Invalid constructor parameters for the agent: ' + err);
      },
    );

    let filteredType = classType as ClassType;

    const methodSchemaEither = getAgentMethodSchema(
      filteredType,
      agentClassName,
    );

    // Note: Either.getOrThrowWith doesn't seem to work within the decorator context
    if (Either.isLeft(methodSchemaEither)) {
      throw new Error(
        `Failed to get agent method schema for ${agentClassName}: ${methodSchemaEither.left}`,
      );
    }

    const methods = methodSchemaEither.right;

    const agentName = AgentName.fromAgentClassName(agentClassName);

    const agentType: AgentType = {
      typeName: agentName,
      description: agentClassName,
      constructor: {
        name: agentClassName,
        description: `Constructs ${agentClassName}`,
        promptHint: 'Enter something...',
        inputSchema: constructorDataSchema,
      },
      methods,
      dependencies: [],
    };

    AgentRegistry.register(agentClassName, agentType);

    (ctor as any).createRemote = getRemoteClient(ctor);
    (ctor as any).createLocal = getLocalClient(ctor);

    AgentInitiatorRegistry.register(
      AgentName.fromAgentClassName(agentClassName),
      {
        initiate: (_agentName: string, constructorParams: DataValue) => {
          const constructorInfo = (classType as ClassType).getConstructors()[0];

          const constructorParamTypes: readonly ParameterInfo[] =
            constructorInfo.getParameters();

          const constructorParamWitValues =
            getWitValueFromDataValue(constructorParams);

          const convertedConstructorArgs = constructorParamWitValues.map(
            (witVal, idx) => {
              return constructTsValueFromWitValue(
                witVal,
                constructorParamTypes[idx].type,
              );
            },
          );

          const instance = new ctor(...convertedConstructorArgs);

          const uniqueAgentId = createUniqueAgentId(agentName);
          (instance as BaseAgent).getId = () => uniqueAgentId;

          const agentInternal: AgentInternal = {
            getId: () => {
              return uniqueAgentId;
            },
            getAgentType: () => {
              const agentType = AgentRegistry.lookup(agentClassName);

              if (Option.isNone(agentType)) {
                throw new Error(
                  `Failed to find agent type for ${agentClassName}. Ensure it is decorated with @agent() and registered properly.`,
                );
              }

              return agentType.value;
            },
            invoke: async (method, args) => {
              const fn = instance[method];
              if (!fn)
                throw new Error(
                  `Method ${method} not found on agent ${agentClassName}`,
                );

              const agentTypeOpt = AgentRegistry.lookup(agentClassName);

              if (Option.isNone(agentTypeOpt)) {
                const error: AgentError = {
                  tag: 'invalid-method',
                  val: `Agent type ${agentClassName} not found in registry.`,
                };
                return {
                  tag: 'err',
                  val: error,
                };
              }

              const agentType = agentTypeOpt.value;

              const methodInfo = (classType as ClassType).getMethod(method)!;

              const methodSignature = methodInfo.getSignatures()[0];

              const paramTypes: readonly ParameterInfo[] =
                methodSignature.getParameters();

              const argsWitValues = getWitValueFromDataValue(args);

              const returnType: Type = methodSignature.returnType;

              const convertedArgs = argsWitValues.map((witVal, idx) => {
                return constructTsValueFromWitValue(
                  witVal,
                  paramTypes[idx].type,
                );
              });

              const result = await fn.apply(instance, convertedArgs);

              const methodDef = agentType.methods.find(
                (m) => m.name === method,
              );

              if (!methodDef) {
                const entriesAsStrings = Array.from(
                  AgentRegistry.entries(),
                ).map(
                  ([key, value]) =>
                    `Key: ${key}, Value: ${JSON.stringify(value, null, 2)}`,
                );

                const error: AgentError = {
                  tag: 'invalid-method',
                  val: `Method ${method} not found in agent type ${agentClassName}. Available methods: ${entriesAsStrings.join(
                    ', ',
                  )}`,
                };

                return {
                  tag: 'err',
                  val: error,
                };
              }

              const returnValue = constructWitValueFromTsValue(
                result,
                returnType,
              );

              if (Either.isLeft(returnValue)) {
                const agentError: AgentError = {
                  tag: 'invalid-method',
                  val: `Invalid return value from ${method}: ${Either.getLeft(returnValue)}`,
                };

                return {
                  tag: 'err',
                  val: agentError,
                };
              }

              return {
                tag: 'ok',
                val: getDataValueFromWitValueReturned(returnValue.right),
              };
            },
          };

          return {
            tag: 'ok',
            val: new ResolvedAgent(agentClassName, agentInternal, instance),
          };
        },
      },
    );
  };
}

export function prompt(prompt: string) {
  return function (target: Object, propertyKey: string) {
    const agentClassName = AgentClassName.fromString(target.constructor.name);
    MethodMetadata.setPromptName(agentClassName, propertyKey, prompt);
  };
}

export function description(desc: string) {
  return function (target: Object, propertyKey: string) {
    const agentClassName = AgentClassName.fromString(target.constructor.name);
    MethodMetadata.setDescription(agentClassName, propertyKey, desc);
  };
}

// FIXME: in the next verison, handle all dataValues
function getWitValueFromDataValue(dataValue: DataValue): WitValue[] {
  if (dataValue.tag === 'tuple') {
    return dataValue.val.map((elem) => {
      if (elem.tag === 'component-model') {
        return elem.val;
      } else {
        throw new Error(`Unsupported element type: ${elem.tag}`);
      }
    });
  } else {
    throw new Error(`Unsupported DataValue type: ${dataValue.tag}`);
  }
}

// Why is return value a tuple with a single element?
// why should it have a name?
function getDataValueFromWitValueReturned(witValues: WitValue): DataValue {
  return {
    tag: 'tuple',
    val: [
      {
        tag: 'component-model',
        val: witValues,
      },
    ],
  };
}
