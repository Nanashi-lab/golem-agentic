declare module 'agent-guest' {
  import * as golemAgentCommon from 'golem:agent/common';
  export namespace guest {
    export function getAgent(agentType: string, agentId: string): Promise<Agent>;
    export function invokeAgent(agentType: string, agentId: string, methodName: string, input: DataValue): Promise<Result<DataValue, AgentError>>;
    export function discoverAgents(): Promise<Agent[]>;
    export function discoverAgentTypes(): Promise<AgentType[]>;
    export class Agent {
      static async create(agentType: string, input: DataValue): Promise<Result<Agent, AgentError>>;
      async getId(): Promise<string>;
      async invoke(methodName: string, input: DataValue): Promise<Result<DataValue, AgentError>>;
      async getDefinition(): Promise<AgentType>;
    }
    export type AgentError = golemAgentCommon.AgentError;
    export type AgentType = golemAgentCommon.AgentType;
    export type DataValue = golemAgentCommon.DataValue;
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
