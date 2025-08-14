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
