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

import { AgentType } from 'golem:agent/common';
import { AgentClassName } from '../AgentClassName';
import * as Option from 'effect/Option';

const agentRegistry = new Map<AgentClassName, AgentType>();

export const AgentRegistry = {
  register(agentClassName: AgentClassName, agentType: AgentType): void {
    agentRegistry.set(agentClassName, agentType);
  },

  entries(): IterableIterator<[AgentClassName, AgentType]> {
    return agentRegistry.entries();
  },

  getRegisteredAgents(): AgentType[] {
    return Array.from(agentRegistry.values());
  },

  lookup(agentClassName: AgentClassName): Option.Option<AgentType> {
    return Option.fromNullable(agentRegistry.get(agentClassName));
  },

  exists(agentClassName: AgentClassName): boolean {
    return agentRegistry.has(agentClassName);
  },
};
