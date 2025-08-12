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

import type * as bindings from 'agent-guest';
import { ResolvedAgent } from './resolved-agent';
import { AgentId } from './agent-id';
import { getRegisteredAgents } from './agent-registry';
import { agentInitiators } from './agent-Initiator';
import { Result } from 'golem:rpc/types@0.2.2';
import { AgentError, DataValue } from 'golem:agent/common';
import { constructWitValueFromValue } from './mapping/values/value';
import { createCustomError } from './agent-error';

export { BaseAgent } from './base-agent';
export { AgentId } from './agent-id';
export { prompt, description, agent } from './decorators';
export { Metadata } from './type_metadata';
export { Either } from './new-types/either';

/// Registry
export const agents = new Map<AgentId, Agent>();

const UninitializedAgentError: AgentError = {
  tag: 'custom-error',
  val: {
    tag: 'tuple',
    val: [
      {
        tag: 'component-model',
        val: constructWitValueFromValue({
          kind: 'string',
          value:
            'Agent is not initialized. Please create an agent first using static function called create',
        }),
      },
    ],
  },
};

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
    if (!this.resolvedAgent) {
      return {
        tag: 'err',
        val: UninitializedAgentError,
      };
    }

    return this.resolvedAgent.invoke(methodName, input);
  }

  async getDefinition(): Promise<any> {
    if (!this.resolvedAgent) {
      return {
        tag: 'err',
        val: UninitializedAgentError,
      };
    }
    this.resolvedAgent.getDefinition();
  }

  static async create(
    agentType: string,
    input: DataValue,
  ): Promise<Result<Agent, AgentError>> {
    const initiator = agentInitiators.get(agentType);

    if (!initiator) {
      const entries = Array.from(agentInitiators.keys());

      return {
        tag: 'err',
        val: createCustomError(
          `No implementation found for agent: ${agentType}. Valid entries are ${entries.join(', ')}`,
        ),
      };
    }

    const initiateResult = initiator.initiate(agentType, input);

    if (initiateResult.tag === 'ok') {
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

// FIXME: agentType is already part of agentId, so we should not need to pass it separately
async function getAgent(agentType: string, agentId: string): Promise<Agent> {
  const typedAgentId = AgentId.fromString(agentId);

  if (typedAgentId.agentName.toString() !== agentType) {
    // FIXME
    throw new Error(
      `Agent ID ${agentId} does not match the expected type ${agentType}`,
    );
  }

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
