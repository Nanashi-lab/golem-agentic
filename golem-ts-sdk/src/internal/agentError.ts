import { AgentError } from 'golem:agent/common';
import * as Value from './mapping/values/Value';

export function createCustomError(error: string): AgentError {
  return {
    tag: 'custom-error',
    val: {
      tag: 'tuple',
      val: [
        {
          tag: 'component-model',
          val: Value.toWitValue({
            kind: 'string',
            value: error,
          }),
        },
      ],
    },
  };
}
