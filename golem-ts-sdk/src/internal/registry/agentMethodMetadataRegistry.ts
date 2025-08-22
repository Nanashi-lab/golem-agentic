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

import { AgentClassName } from '../../newTypes/agentClassName';

const agentMethodMetadataRegistry = new Map<
  AgentClassName,
  Map<string, { prompt?: string; description?: string }>
>();

export const AgentMethodMetadataRegistry = {
  ensureMeta(agentClassName: AgentClassName, method: string) {
    if (!agentMethodMetadataRegistry.has(agentClassName)) {
      agentMethodMetadataRegistry.set(agentClassName, new Map());
    }
    const classMeta = agentMethodMetadataRegistry.get(agentClassName)!;
    if (!classMeta.has(method)) {
      classMeta.set(method, {});
    }
  },

  lookup(agentClassName: AgentClassName) {
    return agentMethodMetadataRegistry.get(agentClassName);
  },

  setPromptName(
    agentClassName: AgentClassName,
    method: string,
    prompt: string,
  ) {
    AgentMethodMetadataRegistry.ensureMeta(agentClassName, method);
    const classMeta = agentMethodMetadataRegistry.get(agentClassName)!;
    classMeta.get(method)!.prompt = prompt;
  },

  setDescription(
    agentClassName: AgentClassName,
    method: string,
    description: string,
  ) {
    AgentMethodMetadataRegistry.ensureMeta(agentClassName, method);
    const classMeta = agentMethodMetadataRegistry.get(agentClassName)!;
    classMeta.get(method)!.description = description;
  },
};
