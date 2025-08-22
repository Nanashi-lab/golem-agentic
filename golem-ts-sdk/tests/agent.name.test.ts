import { describe, expect, it } from 'vitest';
import { AgentTypeName } from '../src/newTypes/agentTypeName';
import { AgentClassName } from '../src';
import fc from 'fast-check';
import { agentClassNameArb } from './arbitraries';

describe('Conversion of TypeScript class names to valid kebab-case agent names', () => {
  it('should convert all type-script valid variations of `AssistantAgent` such as `_AssistantAgent$__1` to `assistant-agent`', () => {
    fc.assert(
      fc.property(agentClassNameArb, (agentClassName) => {
        const agentTypeName = AgentTypeName.fromAgentClassName(agentClassName);
        expect(agentTypeName.value).toEqual('assistant-agent');
      }),
    );
  });

  it('should convert `Assistant` to `assistant`', () => {
    const agentClassName = new AgentClassName('Assistant');
    const agentTypeName = AgentTypeName.fromAgentClassName(agentClassName);

    expect(agentTypeName.value).toEqual('assistant');
  });

  it('should preserve `assistant` as `assistant` itself', () => {
    const agentClassName = new AgentClassName('assistant');
    const agentTypeName = AgentTypeName.fromAgentClassName(agentClassName);

    expect(agentTypeName.value).toEqual('assistant');
  });

  it('should convert single letter `a` to `a', () => {
    const agentClassName = new AgentClassName('a');
    const agentTypeName = AgentTypeName.fromAgentClassName(agentClassName);

    expect(agentTypeName.value).toEqual('a');
  });
});
