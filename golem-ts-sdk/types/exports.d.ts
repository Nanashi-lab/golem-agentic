declare module 'agent-guest' {
  import * as golemAgentCommon from 'golem:agent/common';
  export namespace guest {
    export function initialize(agentType: string, input: DataValue): Promise<Result<void, AgentError>>;
    export function invoke(methodName: string, input: DataValue): Promise<Result<DataValue, AgentError>>;
    export function getDefinition(): Promise<AgentType>;
    export function discoverAgentTypes(): Promise<AgentType[]>;
    export type AgentError = golemAgentCommon.AgentError;
    export type AgentType = golemAgentCommon.AgentType;
    export type DataValue = golemAgentCommon.DataValue;
    export type Result<T, E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
  }
}
