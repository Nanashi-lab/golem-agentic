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

// This step is exactly the same as boostrap step in any user code,
// where the generated type-metadata (using golem-typegen) is loaded
// into memory (TypeMetadata) so it can be used at runtime

// `Metadata` is generated using golem-type-gen tool
// as part of pre-build step which exists in user code too,
// Hence this represents the same bootstrap/main.ts/entrypoint
// in any code-first user code

import { TypeMetadata } from '@golemcloud/golem-ts-types-core';
import { Metadata } from '../.metadata/generated-types';

TypeMetadata.loadFromJson(Metadata);
