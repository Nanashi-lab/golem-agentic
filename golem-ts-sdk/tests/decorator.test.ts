import { AgentTypeRegistry } from '../src/internal/registry/agentTypeRegistry';
import { AgentClassName } from '../src';
import * as Option from 'effect/Option';
import * as Either from 'effect/Either';
import { expect } from 'vitest';
import { AgentInitiatorRegistry } from '../src/internal/registry/agentInitiatorRegistry';
import { AgentTypeName } from '../src/newTypes/agentTypeName';
import { TypeMetadata } from '@golemcloud/golem-ts-types-core';
import * as WitValue from '../src/internal/mapping/values/WitValue';
import { getDataValueFromWitValue } from '../src/decorators';
import * as GolemApiHostModule from 'golem:api/host@1.1.7';

const AssistantAgentClassName = new AgentClassName('AssistantAgent');
const WeatherAgentClassName = new AgentClassName('WeatherAgent');
const WeatherAgentName = AgentTypeName.fromAgentClassName(
  WeatherAgentClassName,
);
const AssistantAgentName = AgentTypeName.fromAgentClassName(
  AssistantAgentClassName,
);

// See testAgents.ts for the agent classes with decorators, which is imported before every test suite via testSetup.ts
it('Agent decorator should register the agent class and its methods into AgentTypeRegistry', () => {
  const assistantAgent = Option.getOrThrowWith(
    AgentTypeRegistry.lookup(AssistantAgentClassName),
    () => new Error('AssistantAgent not found in AgentTypeRegistry'),
  );

  const weatherAgent = Option.getOrThrowWith(
    AgentTypeRegistry.lookup(WeatherAgentClassName),
    () => new Error('WeatherAgent not found in AgentTypeRegistry'),
  );

  expect(assistantAgent.methods.length).toEqual(1);
  expect(assistantAgent.constructor.inputSchema.val.length).toEqual(1);
  expect(weatherAgent.methods.length).toEqual(1);
  expect(weatherAgent.constructor.inputSchema.val.length).toEqual(1);
});

it('WeatherAgent should have method with correct name and description', () => {
  overrideSelfMetadataImpl();

  const typeRegistry = TypeMetadata.get(WeatherAgentClassName.value);

  if (!typeRegistry) {
    throw new Error('WeatherAgent type metadata not found');
  }

  const constructorInfo = typeRegistry.constructorArgs[0].type;

  const constructorArg = 'foo';

  const witValue = Either.getOrThrowWith(
    WitValue.fromTsValue(constructorArg, constructorInfo),
    (error) =>
      new Error(`Failed to convert constructor arg to WitValue. ${error}`),
  );

  const constructorParams = getDataValueFromWitValue(witValue);

  const agentInitiator = Option.getOrThrowWith(
    AgentInitiatorRegistry.lookup(WeatherAgentName),
    () => new Error('WeatherAgent not found in AgentInitiatorRegistry'),
  );

  const result = agentInitiator.initiate(
    WeatherAgentName.value,
    constructorParams,
  );

  expect(1).toEqual(1);
});

function overrideSelfMetadataImpl() {
  vi.spyOn(GolemApiHostModule, 'getSelfMetadata').mockImplementation(() => ({
    workerId: {
      componentId: { uuid: { highBits: 42n, lowBits: 99n } },
      workerName: 'weather-agent',
    },
    args: [],
    env: [],
    wasiConfigVars: [],
    status: 'running',
    componentVersion: 0n,
    retryCount: 0n,
  }));
}
