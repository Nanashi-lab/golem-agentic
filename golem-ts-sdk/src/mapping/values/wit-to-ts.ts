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

import { Type } from 'rttist';
import { WitValue } from 'golem:rpc/types@0.2.2';
import * as Value from './Value';

// Note that we take `expectedType: Type` instead of `expectedType: AnalysedType`(because at this point `AnalysedType` of the `witValue`
// is also available) as `Type` holds more information, and help us have fine-grained control over the type conversion.
// Hence, we need to use `Type` instead of `AnalysedType`. Note that the output of this function is a real ts-value,
// and we need to ensure it is compatible with the `expectedType: Type`.
export function constructTsValueFromWitValue(
  witValue: WitValue,
  expectedType: Type,
): any {
  const value = Value.fromWitValue(witValue);
  return Value.toTsValue(value, expectedType);
}
