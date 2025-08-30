import { TypeMetadata } from '@golemcloud/golem-ts-types-core';
import { Metadata } from '../.metadata/generated-types';
import { TypescriptTypeRegistry } from '../src';

// This setup is ran before every test suite (vitest worker)
// and represents the entry point of any code-first user code

TypescriptTypeRegistry.register(Metadata);

export default (async () => {
  const result = await import('./testAgents');

  console.log(
    `✅ Test-setup: Successfully loaded type metadata and imported agents (decorators). Total classes tracked: ${TypeMetadata.getAll().size}`,
  );

  return result;
})();
