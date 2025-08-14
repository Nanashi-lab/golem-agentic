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

import { getSelfMetadata } from 'golem:api/host@1.1.7';
import { AgentId } from '../agentId';
import { AgentName } from '../newTypes/AgentName';

/**
 * Maintains a counter for each agent type to ensure unique IDs for each instance.
 */
export const agentInstanceSequence = new Map<AgentName, number>();

/**
 * Creates a unique `AgentId` for an agent instance based on its name and the current worker's metadata.
 * Creation of a unique ID will increment the sequence number for that agent type.
 * @param agentName
 */
export function createUniqueAgentId(agentName: AgentName): AgentId {
  const current = agentInstanceSequence.get(agentName) ?? 0;
  agentInstanceSequence.set(agentName, current + 1);
  const count: number = agentInstanceSequence.get(agentName)!;
  const workerName: string = getSelfMetadata().workerId.workerName;
  return new AgentId(workerName, agentName, count);
}
