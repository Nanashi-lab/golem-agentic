import { AgentClassName } from '../src';
import * as Option from 'effect/Option';

// Set up is required to register types and metadata
// This is parallel to the entry point of a real application
import { AgentTypeRegistry } from '../src/internal/registry/agentTypeRegistry';

it('Agent decorator should register the agent class and its methods into AgentTypeRegistry', () => {
  const agentType =
    AgentTypeRegistry.lookup(new AgentClassName('AssistantAgent'))

  expect(Option.isSome(agentType)).toBeTruthy();
})


