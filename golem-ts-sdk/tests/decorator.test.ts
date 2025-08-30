import { AgentTypeRegistry } from '../src/internal/registry/agentTypeRegistry';
import { AgentClassName } from '../src';
import { AgentMethodMetadataRegistry } from '../src/internal/registry/agentMethodMetadataRegistry';
import * as Option from 'effect/Option';
import { expect } from 'vitest';

const AssistantAgentClassName = new AgentClassName('AssistantAgent');
const WeatherAgentClassName = new AgentClassName('WeatherAgent');

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

  console.log(AgentMethodMetadataRegistry);

  expect(assistantAgent.methods.length).toEqual(1);
  expect(assistantAgent.constructor.inputSchema.val.length).toEqual(1);
  expect(weatherAgent.methods.length).toEqual(1);
  expect(weatherAgent.constructor.inputSchema.val.length).toEqual(1);
});
