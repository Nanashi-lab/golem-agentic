import { AgentClassName } from '../../newTypes/AgentClassName';

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
