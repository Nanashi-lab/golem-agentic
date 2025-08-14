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

/**
 * Represents text input for agent methods.
 *
 * Unlike a plain `string`, `TextInput` includes additional metadata,
 * such as `languageCode`, to support unstructured text in multiple languages.
 */
export type TextInput = {
  input: string;
  languageCode: string;
};

/**
 * Creates a `TextInput` with a default language code of `'en'`.
 *
 * @param input - The text content.
 * @returns A `TextInput` object with `languageCode` set to `'en'`.
 */
export function defaultTextInput(input: string): TextInput {
  return {
    input,
    languageCode: 'en',
  };
}
