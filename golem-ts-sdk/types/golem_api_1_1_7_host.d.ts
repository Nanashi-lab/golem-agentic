declare module 'golem:api/host@1.1.7' {
  import * as golemRpc022Types from 'golem:rpc/types@0.2.2';
  import * as wasiClocks023MonotonicClock from 'wasi:clocks/monotonic-clock@0.2.3';
  export function createPromise(): PromiseId;
  export function awaitPromise(promiseId: PromiseId): number[];
  export function pollPromise(promiseId: PromiseId): number[] | undefined;
  export function completePromise(promiseId: PromiseId, data: number[]): boolean;
  export function deletePromise(promiseId: PromiseId): void;
  export function getOplogIndex(): OplogIndex;
  export function setOplogIndex(oplogIdx: OplogIndex): void;
  export function oplogCommit(replicas: number): void;
  export function markBeginOperation(): OplogIndex;
  export function markEndOperation(begin: OplogIndex): void;
  export function getRetryPolicy(): RetryPolicy;
  export function setRetryPolicy(newRetryPolicy: RetryPolicy): void;
  export function getOplogPersistenceLevel(): PersistenceLevel;
  export function setOplogPersistenceLevel(newPersistenceLevel: PersistenceLevel): void;
  export function getIdempotenceMode(): boolean;
  export function setIdempotenceMode(idempotent: boolean): void;
  export function generateIdempotencyKey(): Uuid;
  export function updateWorker(workerId: WorkerId, targetVersion: ComponentVersion, mode: UpdateMode): void;
  export function getSelfMetadata(): WorkerMetadata;
  export function getWorkerMetadata(workerId: WorkerId): WorkerMetadata | undefined;
  export function forkWorker(sourceWorkerId: WorkerId, targetWorkerId: WorkerId, oplogIdxCutOff: OplogIndex): void;
  export function revertWorker(workerId: WorkerId, revertTarget: RevertWorkerTarget): void;
  export function resolveComponentId(componentReference: string): ComponentId | undefined;
  export function resolveWorkerId(componentReference: string, workerName: string): WorkerId | undefined;
  export function resolveWorkerIdStrict(componentReference: string, workerName: string): WorkerId | undefined;
  export function fork(newName: string): ForkResult;
  export class GetWorkers {
    constructor(componentId: ComponentId, filter: WorkerAnyFilter | undefined, precise: boolean);
    getNext(): WorkerMetadata[] | undefined;
  }
  export type Duration = wasiClocks023MonotonicClock.Duration;
  export type ComponentId = golemRpc022Types.ComponentId;
  export type Uuid = golemRpc022Types.Uuid;
  export type ValueAndType = golemRpc022Types.ValueAndType;
  export type WorkerId = golemRpc022Types.WorkerId;
  export type OplogIndex = bigint;
  export type PromiseId = {
    workerId: WorkerId;
    oplogIdx: OplogIndex;
  };
  export type ComponentVersion = bigint;
  export type AccountId = {
    value: string;
  };
  export type ProjectId = {
    uuid: Uuid;
  };
  export type RetryPolicy = {
    maxAttempts: number;
    minDelay: Duration;
    maxDelay: Duration;
    multiplier: number;
    maxJitterFactor: number | undefined;
  };
  export type PersistenceLevel = {
    tag: 'persist-nothing'
  } |
  {
    tag: 'persist-remote-side-effects'
  } |
  {
    tag: 'smart'
  };
  export type UpdateMode = "automatic" | "snapshot-based";
  export type FilterComparator = "equal" | "not-equal" | "greater-equal" | "greater" | "less-equal" | "less";
  export type StringFilterComparator = "equal" | "not-equal" | "like" | "not-like";
  export type WorkerStatus = "running" | "idle" | "suspended" | "interrupted" | "retrying" | "failed" | "exited";
  export type WorkerNameFilter = {
    comparator: StringFilterComparator;
    value: string;
  };
  export type WorkerStatusFilter = {
    comparator: FilterComparator;
    value: WorkerStatus;
  };
  export type WorkerVersionFilter = {
    comparator: FilterComparator;
    value: bigint;
  };
  export type WorkerCreatedAtFilter = {
    comparator: FilterComparator;
    value: bigint;
  };
  export type WorkerEnvFilter = {
    name: string;
    comparator: StringFilterComparator;
    value: string;
  };
  export type WorkerWasiConfigVarsFilter = {
    name: string;
    comparator: StringFilterComparator;
    value: string;
  };
  export type WorkerPropertyFilter = {
    tag: 'name'
    val: WorkerNameFilter
  } |
  {
    tag: 'status'
    val: WorkerStatusFilter
  } |
  {
    tag: 'version'
    val: WorkerVersionFilter
  } |
  {
    tag: 'created-at'
    val: WorkerCreatedAtFilter
  } |
  {
    tag: 'env'
    val: WorkerEnvFilter
  } |
  {
    tag: 'wasi-config-vars'
    val: WorkerWasiConfigVarsFilter
  };
  export type WorkerAllFilter = {
    filters: WorkerPropertyFilter[];
  };
  export type WorkerAnyFilter = {
    filters: WorkerAllFilter[];
  };
  export type WorkerMetadata = {
    workerId: WorkerId;
    args: string[];
    env: [string, string][];
    wasiConfigVars: [string, string][];
    status: WorkerStatus;
    componentVersion: bigint;
    retryCount: bigint;
  };
  export type RevertWorkerTarget = {
    tag: 'revert-to-oplog-index'
    val: OplogIndex
  } |
  {
    tag: 'revert-last-invocations'
    val: bigint
  };
  export type ForkResult = "original" | "forked";
}
