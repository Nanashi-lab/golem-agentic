import { vi } from 'vitest';

// Global mocks which will be used within decorators,
// These host functionalities shouldn't run when decorators run.
// For example, getSelfMetadata is used in some decorators, however,
// it executes only when `initiate` is called.
// Also, these mocks are just place-holders. We can override the behavior
// per tests using functionalities overrides module
vi.mock('golem:api/host@1.1.7', () => ({
  getSelfMetadata: () => ({
    workerId: {
      componentId: { uuid: { highBits: 0n, lowBits: 0n } },
      workerName: 'change-this-by-overriding',
    },
    args: [],
    env: [],
    wasiConfigVars: [],
    status: 'running',
    componentVersion: 0n,
    retryCount: 0n,
  }),
}));

await import('./agentsInit');
