import { AgentClassName } from './agent-name';

const methodMetadata = new Map<
  AgentClassName,
  Map<string, { prompt?: string; description?: string }>
>();

export const MethodMetadata = {
  ensureMeta(agentClassName: AgentClassName, method: string) {
    if (!methodMetadata.has(agentClassName)) {
      methodMetadata.set(agentClassName, new Map());
    }
    const classMeta = methodMetadata.get(agentClassName)!;
    if (!classMeta.has(method)) {
      classMeta.set(method, {});
    }
  },

  lookup(agentClassName: AgentClassName) {
    return methodMetadata.get(agentClassName);
  },

  setPromptName(
    agentClassName: AgentClassName,
    method: string,
    prompt: string,
  ) {
    MethodMetadata.ensureMeta(agentClassName, method);
    const classMeta = methodMetadata.get(agentClassName)!;
    classMeta.get(method)!.prompt = prompt;
  },

  setDescription(
    agentClassName: AgentClassName,
    method: string,
    description: string,
  ) {
    MethodMetadata.ensureMeta(agentClassName, method);
    const classMeta = methodMetadata.get(agentClassName)!;
    classMeta.get(method)!.description = description;
  },
};
