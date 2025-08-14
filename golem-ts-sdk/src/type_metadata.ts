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

import { BaseMetadataLibrary, GlobalMetadata, Type } from 'rttist';
import { AgentClassName } from './AgentClassName';
import * as Option from 'effect/Option';

export const PackageName = '@golemcloud/golem-ts-sdk';

export const Metadata = new BaseMetadataLibrary(
  {
    nullability: false,
  },
  PackageName,
  GlobalMetadata,
);

export const TypeMetadata = {
  update(metadata: Array<any>): void {
    Metadata.clearMetadata(PackageName);
    metadata.forEach((mod) => mod.add(Metadata, false));
  },

  lookupClassMetadata(className: AgentClassName): Option.Option<Type> {
    const types = Metadata.getTypes().filter(
      (type) => type.isClass() && type.name === className.toString(),
    );

    if (types.length === 0) {
      return Option.none();
    }

    return Option.some(types[0]);
  },
};
