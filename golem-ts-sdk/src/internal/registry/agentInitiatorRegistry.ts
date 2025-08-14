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

import { AgentName } from '../../newTypes/AgentName';
import * as Option from 'effect/Option';
import { AgentInitiator } from '../agentInitiator';

// Note that agentRegistry is in index.ts
const agentInitiators = new Map<AgentName, AgentInitiator>();

export const AgentInitiatorRegistry = {
  register(agentName: AgentName, agentInitiator: AgentInitiator): void {
    agentInitiators.set(agentName, agentInitiator);
  },

  lookup(agentName: AgentName): Option.Option<AgentInitiator> {
    return Option.fromNullable(agentInitiators.get(agentName));
  },

  has(agentName: AgentName): boolean {
    return agentInitiators.has(agentName);
  },

  entries(): IterableIterator<[AgentName, AgentInitiator]> {
    return agentInitiators.entries();
  },
};
