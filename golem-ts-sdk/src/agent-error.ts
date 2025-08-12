import { AgentError } from 'golem:agent/common';
import { constructWitValueFromValue } from './mapping/values/value';

export function createCustomError(error: string): AgentError {
  return {
    tag: 'custom-error',
    val: {
      tag: 'tuple',
      val: [
        {
          tag: 'component-model',
          val: constructWitValueFromValue({
            kind: 'string',
            value: error,
          }),
        },
      ],
    },
  };
}
