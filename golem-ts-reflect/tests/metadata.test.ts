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

import { describe, expect, it } from 'vitest';
import { getTestInterfaceType, getTestObjectType } from './util';

describe('can work with ts-morph details', () => {
  it('track interface type', () => {
    const interfaceType = getTestInterfaceType();
    expect(interfaceType.isInterface()).toEqual(true);
  });

  it('track object type', () => {
    const objectType = getTestObjectType();
    console.log(objectType);
    expect(objectType.isObject()).toEqual(true);
  });
});
