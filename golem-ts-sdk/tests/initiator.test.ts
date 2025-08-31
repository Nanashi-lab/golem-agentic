import { TypeMetadata } from '@golemcloud/golem-ts-types-core';
import * as Either from 'effect/Either';
import { getDataValueFromWitValue } from '../src/decorators';
import * as Option from 'effect/Option';
import { AgentInitiatorRegistry } from '../src/internal/registry/agentInitiatorRegistry';
import { expect, it } from 'vitest';
import * as GolemApiHostModule from 'golem:api/host@1.1.7';
import {
  AssistantAgentClassName,
  AssistantAgentName,
  WeatherAgentClassName,
  WeatherAgentName,
} from './testUtils';
import * as WitValue from '../src/internal/mapping/values/WitValue';
import * as fc from 'fast-check';
import { interfaceArb } from './arbitraries';

it('WeatherAgent can be successfully initiated', () => {
  fc.assert(
    fc.property(fc.string(), (arbData) => {
      overrideSelfMetadataImpl();

      const typeRegistry = TypeMetadata.get(WeatherAgentClassName.value);

      if (!typeRegistry) {
        throw new Error('WeatherAgent type metadata not found');
      }

      const constructorInfo = typeRegistry.constructorArgs[0].type;

      const witValue = Either.getOrThrowWith(
        WitValue.fromTsValue(arbData, constructorInfo),
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

      expect(result.tag).toEqual('ok');
    }),
  );
});

it('should correctly perform round-trip conversion for arbitrary values of interface type', () => {
  fc.assert(
    fc.property(interfaceArb, (arbData) => {
      overrideSelfMetadataImpl();

      const typeRegistry = TypeMetadata.get(AssistantAgentClassName.value);

      if (!typeRegistry) {
        throw new Error('WeatherAgent type metadata not found');
      }

      const constructorInfo = typeRegistry.constructorArgs[0].type;

      const witValue = Either.getOrThrowWith(
        WitValue.fromTsValue(arbData, constructorInfo),
        (error) =>
          new Error(`Failed to convert constructor arg to WitValue. ${error}`),
      );

      const constructorParams = getDataValueFromWitValue(witValue);

      const agentInitiator = Option.getOrThrowWith(
        AgentInitiatorRegistry.lookup(AssistantAgentName),
        () => new Error('WeatherAgent not found in AgentInitiatorRegistry'),
      );

      const result = agentInitiator.initiate(
        WeatherAgentName.value,
        constructorParams,
      );

      expect(result.tag).toEqual('ok');
    }),
  );
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
