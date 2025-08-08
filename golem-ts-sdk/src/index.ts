import type * as bindings from 'agent-guest';
import { ResolvedAgent } from './resolved-agent';
import { AgentId } from './agent-id';
import { getRegisteredAgents } from './agent-registry';
import { agentInitiators } from './agent-Initiator';
import { Result, WitValue } from 'golem:rpc/types@0.2.2';
import { AgentError, DataValue } from 'golem:agent/common';

export { BaseAgent } from './base-agent';
export { AgentId } from './agent-id';
export { Prompt, Description, Agent } from './decorators';
export { Metadata } from './type_metadata';

/// Registry
export const agents = new Map<AgentId, Agent>();

// Component export
class Agent {
  resolvedAgent!: ResolvedAgent;

  async getId(): Promise<string> {
    return this.resolvedAgent.getId().toString();
  }

  async invoke(
    methodName: string,
    input: DataValue,
  ): Promise<Result<DataValue, AgentError>> {
    return this.resolvedAgent.invoke(methodName, input);
  }

  async getDefinition(): Promise<any> {
    this.resolvedAgent.getDefinition();
  }

  static async create(
    agentType: string,
    input: DataValue,
  ): Promise<Result<Agent, AgentError>> {
    const initiator = agentInitiators.get(agentType);

    if (!initiator) {
      const entries = Array.from(agentInitiators.keys());

      throw new Error(
        `No implementation found for agent: ${agentType}. Valid entries are ${entries.join(', ')}`,
      );
    }

    const initiateResult = initiator.initiate(agentType, input);

    if (initiateResult.tag == 'ok') {
      const agent = new Agent();
      agent.resolvedAgent = initiateResult.val;

      agents.set(initiateResult.val.getId(), agent);

      return {
        tag: 'ok',
        val: agent,
      };
    } else {
      return {
        tag: 'err',
        val: initiateResult.val,
      };
    }
  }
}

async function getAgent(agentType: string, agentId: string): Promise<Agent> {
  const typedAgentId = AgentId.fromString(agentId);

  const agent = agents.get(typedAgentId);

  if (!agent) {
    // FIXME: Fix WIT to return a Promise<Result<Agent, AgentError>>
    throw new Error(`Agent with ID ${agentId} not found`);
  }

  return agent;
}

async function discoverAgents(): Promise<Agent[]> {
  return Array.from(agents.values());
}

async function discoverAgentTypes(): Promise<bindings.guest.AgentType[]> {
  return getRegisteredAgents();
}

export const guest: typeof bindings.guest = {
  getAgent,
  discoverAgents,
  discoverAgentTypes,
  Agent,
};
