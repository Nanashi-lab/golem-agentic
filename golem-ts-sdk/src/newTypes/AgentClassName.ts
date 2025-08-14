import { Branded } from '../internal/branding';

export type AgentClassName = Branded<string, 'AgentClassName'>;

export const fromString = (name: string): AgentClassName => {
  return name as AgentClassName;
};
