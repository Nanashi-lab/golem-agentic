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
import { ResolvedAgent } from './internal/resolvedAgent';
import { AgentId } from './agentId';
import { Result } from 'golem:rpc/types@0.2.2';
import { AgentError, AgentType, DataValue } from 'golem:agent/common';
import * as Value from './internal/mapping/values/Value';
import { createCustomError } from './internal/agentError';
import { AgentInitiatorRegistry } from './internal/agentInitiator';
import { AgentRegistry } from './internal/agentRegistry';
import * as Option from 'effect/Option';
export { BaseAgent } from './baseAgent';
export { AgentId } from './agentId';
export { prompt, description, agent } from './decorators';
export { Metadata } from './typeMetadata';
export * as Either from './newTypes/Either';
export * as UnstructuredText from './newTypes/TextInput';
import * as AgentName from './AgentName';

/// Registry
export const agents = new Map<AgentId, Agent>();

const UninitiatedAgentErrorMessage: string =
  'Agent is not initialized. Please create an agent first using static function called create';

const UninitializedAgentError: AgentError = {
  tag: 'custom-error',
  val: {
    tag: 'tuple',
    val: [
      {
        tag: 'component-model',
        val: Value.toWitValue({
          kind: 'string',
          value: UninitiatedAgentErrorMessage,
        }),
      },
    ],
  },
};

// An error can happen if the user agent is not composed (which will initialize the agent with precompiled wasm)
function getResolvedAgentOrThrow(
  resolvedAgent: Option.Option<ResolvedAgent>,
): ResolvedAgent {
  return Option.getOrThrowWith(
    resolvedAgent,
    () => new Error(UninitiatedAgentErrorMessage),
  );
}

// Component export
class Agent {
  resolvedAgent: Option.Option<ResolvedAgent> = Option.none();

  async getId(): Promise<string> {
    return getResolvedAgentOrThrow(this.resolvedAgent).getId().toString();
  }

  async invoke(
    methodName: string,
    input: DataValue,
  ): Promise<Result<DataValue, AgentError>> {
    if (Option.isNone(this.resolvedAgent)) {
      return {
        tag: 'err',
        val: UninitializedAgentError,
      };
    }

    return this.resolvedAgent.value.invoke(methodName, input);
  }

  async getDefinition(): Promise<AgentType> {
    return getResolvedAgentOrThrow(this.resolvedAgent).getDefinition();
  }

  static async create(
    agentType: string,
    input: DataValue,
  ): Promise<Result<Agent, AgentError>> {
    const initiator = AgentInitiatorRegistry.lookup(
      AgentName.fromString(agentType),
    );

    if (Option.isNone(initiator)) {
      const entries = Array.from(AgentInitiatorRegistry.entries()).map(
        (entry) => entry[0],
      );

      return {
        tag: 'err',
        val: createCustomError(
          `No implementation found for agent: ${agentType}. Valid entries are ${entries.join(', ')}`,
        ),
      };
    }

    const initiateResult = initiator.value.initiate(agentType, input);

    if (initiateResult.tag === 'ok') {
      const agent = new Agent();
      agent.resolvedAgent = Option.some(initiateResult.val);

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

  if (typedAgentId.agentName.toString() !== agentType) {
    throw new Error(
      `Agent ID ${agentId} does not match the expected type ${agentType}`,
    );
  }

  const agent = agents.get(typedAgentId);

  if (!agent) {
    throw new Error(`Agent with ID ${agentId} not found`);
  }

  return agent;
}

async function discoverAgents(): Promise<Agent[]> {
  return Array.from(agents.values());
}

async function discoverAgentTypes(): Promise<bindings.guest.AgentType[]> {
  return AgentRegistry.getRegisteredAgents();
}

export const guest: typeof bindings.guest = {
  getAgent,
  discoverAgents,
  discoverAgentTypes,
  Agent,
};
