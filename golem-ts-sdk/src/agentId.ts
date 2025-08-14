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

import { AgentName } from './AgentName';

/**
 * Represents a globally unique identifier for an agent instance.
 */
export class AgentId {
  /**
   * Creates a new `AgentId` instance.
   *
   * @param agentContainerName - The name of the container (e.g., worker or module) in which the agent lives.
   * @param agentName - The name of the agent.
   *   This is typically a unique identifier for the agent type,
   *   and is used in coordination with the container name and
   *   sequence number to form a globally unique `AgentId`.
   * @param localAgentSeqNum - A numeric sequence number to distinguish multiple instances.
   */
  constructor(
    public readonly agentContainerName: string,
    public readonly agentName: AgentName,
    public readonly localAgentSeqNum: number,
  ) {}

  toString(): string {
    return `${this.agentContainerName}--${this.agentName}--${this.localAgentSeqNum}`;
  }

  static fromString(s: string): AgentId {
    const parts = s.split('--');
    if (parts.length < 3) {
      throw new Error(`Invalid AgentId format: ${s}`);
    }
    const count = parseInt(parts.pop()!, 10);
    const agentName = parts.pop()!;
    const workerName = parts.join('--');
    return new AgentId(workerName, agentName as AgentName, count);
  }
}
