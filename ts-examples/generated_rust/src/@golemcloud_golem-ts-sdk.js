import { WasmRpc } from 'golem:rpc/types@0.2.2';
import { getSelfMetadata } from 'golem:api/host@1.1.7';

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
 * Represents a globally unique identifier for an agent instance.
 */
class AgentId {
    /**
     * Creates a new `AgentId` instance.
     *
     * @param agentContainerName - The name of the container (e.g., worker or module) in which the agent lives.
     * @param agentName - The name of the agent.
     *   This is typically a unique identifier for the agent type,
     *   and is used in coordination with the container name and
     *   sequence number to form a globally unique `AgentId`.
     * @param localAgentSeqNum - A numeric sequence number to distinguish multiple instances.
     */
    constructor(agentContainerName, agentName, localAgentSeqNum) {
        this.agentContainerName = agentContainerName;
        this.agentName = agentName;
        this.localAgentSeqNum = localAgentSeqNum;
    }
    toString() {
        return `${this.agentContainerName}--${this.agentName}--${this.localAgentSeqNum}`;
    }
    static fromString(s) {
        const parts = s.split('--');
        if (parts.length < 3) {
            throw new Error(`Invalid AgentId format: ${s}`);
        }
        const count = parseInt(parts.pop(), 10);
        const agentName = parts.pop();
        const workerName = parts.join('--');
        return new AgentId(workerName, agentName, count);
    }
}

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
function constructValueFromWitValue(wit) {
    if (!wit.nodes.length)
        throw new Error('Empty nodes in WitValue');
    return buildTree(wit.nodes[wit.nodes.length - 1], wit.nodes);
}
function buildTree(node, nodes) {
    switch (node.tag) {
        case 'record-value':
            return {
                kind: 'record',
                value: node.val.map((idx) => buildTree(nodes[idx], nodes)),
            };
        case 'variant-value': {
            const [caseIdx, maybeIndex] = node.val;
            if (maybeIndex !== undefined) {
                return {
                    kind: 'variant',
                    caseIdx,
                    caseValue: buildTree(nodes[maybeIndex], nodes),
                };
            }
            else {
                return {
                    kind: 'variant',
                    caseIdx,
                    caseValue: undefined,
                };
            }
        }
        case 'enum-value':
            return { kind: 'enum', value: node.val };
        case 'flags-value':
            return { kind: 'flags', value: node.val };
        case 'tuple-value':
            return {
                kind: 'tuple',
                value: node.val.map((idx) => buildTree(nodes[idx], nodes)),
            };
        case 'list-value':
            return {
                kind: 'list',
                value: node.val.map((idx) => buildTree(nodes[idx], nodes)),
            };
        case 'option-value':
            if (node.val === undefined) {
                return { kind: 'option', value: undefined };
            }
            return {
                kind: 'option',
                value: buildTree(nodes[node.val], nodes),
            };
        case 'result-value': {
            const res = node.val;
            if (res.tag === 'ok') {
                return {
                    kind: 'result',
                    value: {
                        ok: res.val !== undefined
                            ? buildTree(nodes[res.val], nodes)
                            : undefined,
                    },
                };
            }
            else {
                return {
                    kind: 'result',
                    value: {
                        err: res.val !== undefined
                            ? buildTree(nodes[res.val], nodes)
                            : undefined,
                    },
                };
            }
        }
        case 'prim-u8':
            return { kind: 'u8', value: node.val };
        case 'prim-u16':
            return { kind: 'u16', value: node.val };
        case 'prim-u32':
            return { kind: 'u32', value: node.val };
        case 'prim-u64':
            return { kind: 'u64', value: node.val };
        case 'prim-s8':
            return { kind: 's8', value: node.val };
        case 'prim-s16':
            return { kind: 's16', value: node.val };
        case 'prim-s32':
            return { kind: 's32', value: node.val };
        case 'prim-s64':
            return { kind: 's64', value: node.val };
        case 'prim-float32':
            return { kind: 'f32', value: node.val };
        case 'prim-float64':
            return { kind: 'f64', value: node.val };
        case 'prim-char':
            return { kind: 'char', value: node.val };
        case 'prim-bool':
            return { kind: 'bool', value: node.val };
        case 'prim-string':
            return { kind: 'string', value: node.val };
        case 'handle': {
            const [uri, resourceId] = node.val;
            return {
                kind: 'handle',
                uri: uri.value,
                resourceId,
            };
        }
        default:
            throw new Error(`Unhandled tag: ${node.tag}`);
    }
}
function constructWitValueFromValue(value) {
    const nodes = [];
    buildNodes(value, nodes);
    return { nodes: nodes };
}
function buildNodes(value, nodes) {
    const push = (node) => {
        nodes.push(node);
        return nodes.length - 1;
    };
    switch (value.kind) {
        case 'record':
            const recordIndices = value.value.map((v) => buildNodes(v, nodes));
            return push({ tag: 'record-value', val: recordIndices });
        case 'variant':
            return push({
                tag: 'variant-value',
                val: value.caseValue !== undefined
                    ? [value.caseIdx, buildNodes(value.caseValue, nodes)]
                    : [value.caseIdx, undefined],
            });
        case 'enum':
            return push({ tag: 'enum-value', val: value.value });
        case 'flags':
            return push({ tag: 'flags-value', val: value.value });
        case 'tuple':
            const tupleIndices = value.value.map((v) => buildNodes(v, nodes));
            return push({ tag: 'tuple-value', val: tupleIndices });
        case 'list':
            const listIndices = value.value.map((v) => buildNodes(v, nodes));
            return push({ tag: 'list-value', val: listIndices });
        case 'option':
            return push({
                tag: 'option-value',
                val: value.value !== undefined
                    ? buildNodes(value.value, nodes)
                    : undefined,
            });
        case 'result':
            if ('ok' in value.value) {
                return push({
                    tag: 'result-value',
                    val: {
                        tag: 'ok',
                        val: value.value.ok !== undefined
                            ? buildNodes(value.value.ok, nodes)
                            : undefined,
                    },
                });
            }
            else {
                return push({
                    tag: 'result-value',
                    val: {
                        tag: 'err',
                        val: value.value.err !== undefined
                            ? buildNodes(value.value.err, nodes)
                            : undefined,
                    },
                });
            }
        case 'u8':
            return push({ tag: 'prim-u8', val: value.value });
        case 'u16':
            return push({ tag: 'prim-u16', val: value.value });
        case 'u32':
            return push({ tag: 'prim-u32', val: value.value });
        case 'u64':
            return push({ tag: 'prim-u64', val: value.value });
        case 's8':
            return push({ tag: 'prim-s8', val: value.value });
        case 's16':
            return push({ tag: 'prim-s16', val: value.value });
        case 's32':
            return push({ tag: 'prim-s32', val: value.value });
        case 's64':
            return push({ tag: 'prim-s64', val: value.value });
        case 'f32':
            return push({ tag: 'prim-float32', val: value.value });
        case 'f64':
            return push({ tag: 'prim-float64', val: value.value });
        case 'char':
            return push({ tag: 'prim-char', val: value.value });
        case 'bool':
            return push({ tag: 'prim-bool', val: value.value });
        case 'string':
            return push({ tag: 'prim-string', val: value.value });
        case 'handle':
            return push({
                tag: 'handle',
                val: [{ value: value.uri }, value.resourceId],
            });
        default:
            throw new Error(`Unhandled kind: ${value.kind}`);
    }
}

function createCustomError(error) {
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

/**
 * Tests if a value is a `function`.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { isFunction } from "effect/Predicate"
 *
 * assert.deepStrictEqual(isFunction(isFunction), true)
 * assert.deepStrictEqual(isFunction("function"), false)
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
const isFunction$1 = input => typeof input === "function";
/**
 * Creates a function that can be used in a data-last (aka `pipe`able) or
 * data-first style.
 *
 * The first parameter to `dual` is either the arity of the uncurried function
 * or a predicate that determines if the function is being used in a data-first
 * or data-last style.
 *
 * Using the arity is the most common use case, but there are some cases where
 * you may want to use a predicate. For example, if you have a function that
 * takes an optional argument, you can use a predicate to determine if the
 * function is being used in a data-first or data-last style.
 *
 * You can pass either the arity of the uncurried function or a predicate
 * which determines if the function is being used in a data-first or
 * data-last style.
 *
 * **Example** (Using arity to determine data-first or data-last style)
 *
 * ```ts
 * import { dual, pipe } from "effect/Function"
 *
 * const sum = dual<
 *   (that: number) => (self: number) => number,
 *   (self: number, that: number) => number
 * >(2, (self, that) => self + that)
 *
 * console.log(sum(2, 3)) // 5
 * console.log(pipe(2, sum(3))) // 5
 * ```
 *
 * **Example** (Using call signatures to define the overloads)
 *
 * ```ts
 * import { dual, pipe } from "effect/Function"
 *
 * const sum: {
 *   (that: number): (self: number) => number
 *   (self: number, that: number): number
 * } = dual(2, (self: number, that: number): number => self + that)
 *
 * console.log(sum(2, 3)) // 5
 * console.log(pipe(2, sum(3))) // 5
 * ```
 *
 * **Example** (Using a predicate to determine data-first or data-last style)
 *
 * ```ts
 * import { dual, pipe } from "effect/Function"
 *
 * const sum = dual<
 *   (that: number) => (self: number) => number,
 *   (self: number, that: number) => number
 * >(
 *   (args) => args.length === 2,
 *   (self, that) => self + that
 * )
 *
 * console.log(sum(2, 3)) // 5
 * console.log(pipe(2, sum(3))) // 5
 * ```
 *
 * @since 2.0.0
 */
const dual = function (arity, body) {
  if (typeof arity === "function") {
    return function () {
      if (arity(arguments)) {
        // @ts-expect-error
        return body.apply(this, arguments);
      }
      return self => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function (a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function (self) {
          return body(self, a);
        };
      };
    case 3:
      return function (a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function (self) {
          return body(self, a, b);
        };
      };
    case 4:
      return function (a, b, c, d) {
        if (arguments.length >= 4) {
          return body(a, b, c, d);
        }
        return function (self) {
          return body(self, a, b, c);
        };
      };
    case 5:
      return function (a, b, c, d, e) {
        if (arguments.length >= 5) {
          return body(a, b, c, d, e);
        }
        return function (self) {
          return body(self, a, b, c, d);
        };
      };
    default:
      return function () {
        if (arguments.length >= arity) {
          // @ts-expect-error
          return body.apply(this, arguments);
        }
        const args = arguments;
        return function (self) {
          return body(self, ...args);
        };
      };
  }
};

/**
 * The `GlobalValue` module ensures that a single instance of a value is created globally,
 * even when modules are imported multiple times (e.g., due to mixing CommonJS and ESM builds)
 * or during hot-reloading in development environments like Next.js or Remix.
 *
 * It achieves this by using a versioned global store, identified by a unique `Symbol` tied to
 * the current version of the `effect` library. The store holds values that are keyed by an identifier,
 * allowing the reuse of previously computed instances across imports or reloads.
 *
 * This pattern is particularly useful in scenarios where frequent reloading can cause services or
 * single-instance objects to be recreated unnecessarily, such as in development environments with hot-reloading.
 *
 * @since 2.0.0
 */
const globalStoreId = `effect/GlobalValue`;
let globalStore;
/**
 * Retrieves or computes a global value associated with the given `id`. If the value for this `id`
 * has already been computed, it will be returned from the global store. If it does not exist yet,
 * the provided `compute` function will be executed to compute the value, store it, and then return it.
 *
 * This ensures that even in cases where the module is imported multiple times (e.g., in mixed environments
 * like CommonJS and ESM, or during hot-reloading in development), the value is computed only once and reused
 * thereafter.
 *
 * @example
 * ```ts
 * import { globalValue } from "effect/GlobalValue"
 *
 * // This cache will persist as long as the module is running,
 * // even if reloaded or imported elsewhere
 * const myCache = globalValue(
 *   Symbol.for("myCache"),
 *   () => new WeakMap<object, number>()
 * )
 * ```
 *
 * @since 2.0.0
 */
const globalValue = (id, compute) => {
  if (!globalStore) {
    // @ts-expect-error
    globalThis[globalStoreId] ??= new Map();
    // @ts-expect-error
    globalStore = globalThis[globalStoreId];
  }
  if (!globalStore.has(id)) {
    globalStore.set(id, compute());
  }
  return globalStore.get(id);
};

/**
 * This module provides a collection of functions for working with predicates and refinements.
 *
 * A `Predicate<A>` is a function that takes a value of type `A` and returns a boolean.
 * It is used to check if a value satisfies a certain condition.
 *
 * A `Refinement<A, B>` is a special type of predicate that not only checks a condition
 * but also provides a type guard, allowing TypeScript to narrow the type of the input
 * value from `A` to a more specific type `B` within a conditional block.
 *
 * The module includes:
 * - Basic predicates and refinements for common types (e.g., `isString`, `isNumber`).
 * - Combinators to create new predicates from existing ones (e.g., `and`, `or`, `not`).
 * - Advanced combinators for working with data structures (e.g., `tuple`, `struct`).
 * - Type-level utilities for inspecting predicate and refinement types.
 *
 * @since 2.0.0
 */
/**
 * A refinement that checks if a value is a `Function`.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { isFunction } from "effect/Predicate"
 *
 * assert.strictEqual(isFunction(() => {}), true)
 * assert.strictEqual(isFunction(isFunction), true)
 *
 * assert.strictEqual(isFunction("function"), false)
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
const isFunction = isFunction$1;
/**
 * Checks if the input is an object or an array.
 * @internal
 */
const isRecordOrArray = input => typeof input === "object" && input !== null;
/**
 * A refinement that checks if a value is an `object`. Note that in JavaScript,
 * arrays and functions are also considered objects.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { isObject } from "effect/Predicate"
 *
 * assert.strictEqual(isObject({}), true)
 * assert.strictEqual(isObject([]), true)
 * assert.strictEqual(isObject(() => {}), true)
 *
 * assert.strictEqual(isObject(null), false)
 * assert.strictEqual(isObject("hello"), false)
 * ```
 *
 * @category guards
 * @since 2.0.0
 * @see isRecord to check for plain objects (excluding arrays and functions).
 */
const isObject = input => isRecordOrArray(input) || isFunction(input);
/**
 * A refinement that checks if a value is an object-like value and has a specific property key.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { hasProperty } from "effect/Predicate"
 *
 * assert.strictEqual(hasProperty({ a: 1 }, "a"), true)
 * assert.strictEqual(hasProperty({ a: 1 }, "b"), false)
 *
 * const value: unknown = { name: "Alice" };
 * if (hasProperty(value, "name")) {
 *   // The type of `value` is narrowed to `{ name: unknown }`
 *   // and we can safely access `value.name`
 *   console.log(value.name)
 * }
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
const hasProperty = /*#__PURE__*/dual(2, (self, property) => isObject(self) && property in self);

/**
 * @since 2.0.0
 */
/**
 * @category constructors
 * @since 2.0.0
 */
class SingleShotGen {
  self;
  called = false;
  constructor(self) {
    this.self = self;
  }
  /**
   * @since 2.0.0
   */
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  /**
   * @since 2.0.0
   */
  return(a) {
    return {
      value: a,
      done: true
    };
  }
  /**
   * @since 2.0.0
   */
  throw(e) {
    throw e;
  }
  /**
   * @since 2.0.0
   */
  [Symbol.iterator]() {
    return new SingleShotGen(this.self);
  }
}
/**
 * @since 3.0.6
 */
const YieldWrapTypeId = /*#__PURE__*/Symbol.for("effect/Utils/YieldWrap");
/**
 * @since 3.0.6
 */
class YieldWrap {
  /**
   * @since 3.0.6
   */
  #value;
  constructor(value) {
    this.#value = value;
  }
  /**
   * @since 3.0.6
   */
  [YieldWrapTypeId]() {
    return this.#value;
  }
}
/**
 * Note: this is an experimental feature made available to allow custom matchers in tests, not to be directly used yet in user code
 *
 * @since 3.1.1
 * @status experimental
 * @category modifiers
 */
const structuralRegionState = /*#__PURE__*/globalValue("effect/Utils/isStructuralRegion", () => ({
  enabled: false,
  tester: undefined
}));

/**
 * @since 2.0.0
 */
/** @internal */
const randomHashCache = /*#__PURE__*/globalValue(/*#__PURE__*/Symbol.for("effect/Hash/randomHashCache"), () => new WeakMap());
/**
 * @since 2.0.0
 * @category symbols
 */
const symbol$1 = /*#__PURE__*/Symbol.for("effect/Hash");
/**
 * @since 2.0.0
 * @category hashing
 */
const hash = self => {
  if (structuralRegionState.enabled === true) {
    return 0;
  }
  switch (typeof self) {
    case "number":
      return number(self);
    case "bigint":
      return string(self.toString(10));
    case "boolean":
      return string(String(self));
    case "symbol":
      return string(String(self));
    case "string":
      return string(self);
    case "undefined":
      return string("undefined");
    case "function":
    case "object":
      {
        if (self === null) {
          return string("null");
        } else if (self instanceof Date) {
          return hash(self.toISOString());
        } else if (self instanceof URL) {
          return hash(self.href);
        } else if (isHash(self)) {
          return self[symbol$1]();
        } else {
          return random(self);
        }
      }
    default:
      throw new Error(`BUG: unhandled typeof ${typeof self} - please report an issue at https://github.com/Effect-TS/effect/issues`);
  }
};
/**
 * @since 2.0.0
 * @category hashing
 */
const random = self => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
  }
  return randomHashCache.get(self);
};
/**
 * @since 2.0.0
 * @category hashing
 */
const combine = b => self => self * 53 ^ b;
/**
 * @since 2.0.0
 * @category hashing
 */
const optimize = n => n & 0xbfffffff | n >>> 1 & 0x40000000;
/**
 * @since 2.0.0
 * @category guards
 */
const isHash = u => hasProperty(u, symbol$1);
/**
 * @since 2.0.0
 * @category hashing
 */
const number = n => {
  if (n !== n || n === Infinity) {
    return 0;
  }
  let h = n | 0;
  if (h !== n) {
    h ^= n * 0xffffffff;
  }
  while (n > 0xffffffff) {
    h ^= n /= 0xffffffff;
  }
  return optimize(h);
};
/**
 * @since 2.0.0
 * @category hashing
 */
const string = str => {
  let h = 5381,
    i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
/**
 * @since 2.0.0
 * @category hashing
 */
const cached = function () {
  if (arguments.length === 1) {
    const self = arguments[0];
    return function (hash) {
      Object.defineProperty(self, symbol$1, {
        value() {
          return hash;
        },
        enumerable: false
      });
      return hash;
    };
  }
  const self = arguments[0];
  const hash = arguments[1];
  Object.defineProperty(self, symbol$1, {
    value() {
      return hash;
    },
    enumerable: false
  });
  return hash;
};

/**
 * @since 2.0.0
 * @category symbols
 */
const symbol = /*#__PURE__*/Symbol.for("effect/Equal");
function equals() {
  if (arguments.length === 1) {
    return self => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that) {
    return true;
  }
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "object" || selfType === "function") {
    if (self !== null && that !== null) {
      if (isEqual(self) && isEqual(that)) {
        if (hash(self) === hash(that) && self[symbol](that)) {
          return true;
        } else {
          return structuralRegionState.enabled && structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
        }
      } else if (self instanceof Date && that instanceof Date) {
        return self.toISOString() === that.toISOString();
      } else if (self instanceof URL && that instanceof URL) {
        return self.href === that.href;
      }
    }
    if (structuralRegionState.enabled) {
      if (Array.isArray(self) && Array.isArray(that)) {
        return self.length === that.length && self.every((v, i) => compareBoth(v, that[i]));
      }
      if (Object.getPrototypeOf(self) === Object.prototype && Object.getPrototypeOf(self) === Object.prototype) {
        const keysSelf = Object.keys(self);
        const keysThat = Object.keys(that);
        if (keysSelf.length === keysThat.length) {
          for (const key of keysSelf) {
            // @ts-expect-error
            if (!(key in that && compareBoth(self[key], that[key]))) {
              return structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
            }
          }
          return true;
        }
      }
      return structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
    }
  }
  return structuralRegionState.enabled && structuralRegionState.tester ? structuralRegionState.tester(self, that) : false;
}
/**
 * @since 2.0.0
 * @category guards
 */
const isEqual = u => hasProperty(u, symbol);

/**
 * @since 2.0.0
 * @category symbols
 */
const NodeInspectSymbol = /*#__PURE__*/Symbol.for("nodejs.util.inspect.custom");
/**
 * @since 2.0.0
 */
const toJSON = x => {
  try {
    if (hasProperty(x, "toJSON") && isFunction(x["toJSON"]) && x["toJSON"].length === 0) {
      return x.toJSON();
    } else if (Array.isArray(x)) {
      return x.map(toJSON);
    }
  } catch {
    return {};
  }
  return redact(x);
};
/**
 * @since 2.0.0
 */
const format = x => JSON.stringify(x, null, 2);
/**
 * @since 3.10.0
 * @category redactable
 */
const symbolRedactable = /*#__PURE__*/Symbol.for("effect/Inspectable/Redactable");
/**
 * @since 3.10.0
 * @category redactable
 */
const isRedactable = u => typeof u === "object" && u !== null && symbolRedactable in u;
const redactableState = /*#__PURE__*/globalValue("effect/Inspectable/redactableState", () => ({
  fiberRefs: undefined
}));
/**
 * @since 3.10.0
 * @category redactable
 */
const redact = u => {
  if (isRedactable(u) && redactableState.fiberRefs !== undefined) {
    return u[symbolRedactable](redactableState.fiberRefs);
  }
  return u;
};

/**
 * @since 2.0.0
 */
/**
 * @since 2.0.0
 */
const pipeArguments = (self, args) => {
  switch (args.length) {
    case 0:
      return self;
    case 1:
      return args[0](self);
    case 2:
      return args[1](args[0](self));
    case 3:
      return args[2](args[1](args[0](self)));
    case 4:
      return args[3](args[2](args[1](args[0](self))));
    case 5:
      return args[4](args[3](args[2](args[1](args[0](self)))));
    case 6:
      return args[5](args[4](args[3](args[2](args[1](args[0](self))))));
    case 7:
      return args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))));
    case 8:
      return args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self))))))));
    case 9:
      return args[8](args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self)))))))));
    default:
      {
        let ret = self;
        for (let i = 0, len = args.length; i < len; i++) {
          ret = args[i](ret);
        }
        return ret;
      }
  }
};

let moduleVersion = "3.17.7";
const getCurrentVersion = () => moduleVersion;

/** @internal */
const EffectTypeId = /*#__PURE__*/Symbol.for("effect/Effect");
/** @internal */
const StreamTypeId = /*#__PURE__*/Symbol.for("effect/Stream");
/** @internal */
const SinkTypeId = /*#__PURE__*/Symbol.for("effect/Sink");
/** @internal */
const ChannelTypeId = /*#__PURE__*/Symbol.for("effect/Channel");
/** @internal */
const effectVariance = {
  /* c8 ignore next */
  _R: _ => _,
  /* c8 ignore next */
  _E: _ => _,
  /* c8 ignore next */
  _A: _ => _,
  _V: /*#__PURE__*/getCurrentVersion()
};
const sinkVariance = {
  /* c8 ignore next */
  _A: _ => _,
  /* c8 ignore next */
  _In: _ => _,
  /* c8 ignore next */
  _L: _ => _,
  /* c8 ignore next */
  _E: _ => _,
  /* c8 ignore next */
  _R: _ => _
};
const channelVariance = {
  /* c8 ignore next */
  _Env: _ => _,
  /* c8 ignore next */
  _InErr: _ => _,
  /* c8 ignore next */
  _InElem: _ => _,
  /* c8 ignore next */
  _InDone: _ => _,
  /* c8 ignore next */
  _OutErr: _ => _,
  /* c8 ignore next */
  _OutElem: _ => _,
  /* c8 ignore next */
  _OutDone: _ => _
};
/** @internal */
const EffectPrototype = {
  [EffectTypeId]: effectVariance,
  [StreamTypeId]: effectVariance,
  [SinkTypeId]: sinkVariance,
  [ChannelTypeId]: channelVariance,
  [symbol](that) {
    return this === that;
  },
  [symbol$1]() {
    return cached(this, random(this));
  },
  [Symbol.iterator]() {
    return new SingleShotGen(new YieldWrap(this));
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};

/**
 * @since 2.0.0
 */
const TypeId$1 = /*#__PURE__*/Symbol.for("effect/Option");
const CommonProto$1 = {
  ...EffectPrototype,
  [TypeId$1]: {
    _A: _ => _
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};
const SomeProto = /*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(CommonProto$1), {
  _tag: "Some",
  _op: "Some",
  [symbol](that) {
    return isOption(that) && isSome$1(that) && equals(this.value, that.value);
  },
  [symbol$1]() {
    return cached(this, combine(hash(this._tag))(hash(this.value)));
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag,
      value: toJSON(this.value)
    };
  }
});
const NoneHash = /*#__PURE__*/hash("None");
const NoneProto = /*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(CommonProto$1), {
  _tag: "None",
  _op: "None",
  [symbol](that) {
    return isOption(that) && isNone$1(that);
  },
  [symbol$1]() {
    return NoneHash;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag
    };
  }
});
/** @internal */
const isOption = input => hasProperty(input, TypeId$1);
/** @internal */
const isNone$1 = fa => fa._tag === "None";
/** @internal */
const isSome$1 = fa => fa._tag === "Some";
/** @internal */
const none$1 = /*#__PURE__*/Object.create(NoneProto);
/** @internal */
const some$1 = value => {
  const a = Object.create(SomeProto);
  a.value = value;
  return a;
};

/**
 * @since 2.0.0
 */
/**
 * @internal
 */
const TypeId = /*#__PURE__*/Symbol.for("effect/Either");
const CommonProto = {
  ...EffectPrototype,
  [TypeId]: {
    _R: _ => _
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};
const RightProto = /*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(CommonProto), {
  _tag: "Right",
  _op: "Right",
  [symbol](that) {
    return isEither(that) && isRight$1(that) && equals(this.right, that.right);
  },
  [symbol$1]() {
    return combine(hash(this._tag))(hash(this.right));
  },
  toJSON() {
    return {
      _id: "Either",
      _tag: this._tag,
      right: toJSON(this.right)
    };
  }
});
const LeftProto = /*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(CommonProto), {
  _tag: "Left",
  _op: "Left",
  [symbol](that) {
    return isEither(that) && isLeft$1(that) && equals(this.left, that.left);
  },
  [symbol$1]() {
    return combine(hash(this._tag))(hash(this.left));
  },
  toJSON() {
    return {
      _id: "Either",
      _tag: this._tag,
      left: toJSON(this.left)
    };
  }
});
/** @internal */
const isEither = input => hasProperty(input, TypeId);
/** @internal */
const isLeft$1 = ma => ma._tag === "Left";
/** @internal */
const isRight$1 = ma => ma._tag === "Right";
/** @internal */
const left$1 = left => {
  const a = Object.create(LeftProto);
  a.left = left;
  return a;
};
/** @internal */
const right$1 = right => {
  const a = Object.create(RightProto);
  a.right = right;
  return a;
};
/** @internal */
const getLeft$1 = self => isRight$1(self) ? none$1 : some$1(self.left);

/**
 * Represents the absence of a value by creating an empty `Option`.
 *
 * `Option.none` returns an `Option<never>`, which is a subtype of `Option<A>`.
 * This means you can use it in place of any `Option<A>` regardless of the type
 * `A`.
 *
 * **Example** (Creating an Option with No Value)
 *
 * ```ts
 * import { Option } from "effect"
 *
 * // An Option holding no value
 * //
 * //      ┌─── Option<never>
 * //      ▼
 * const noValue = Option.none()
 *
 * console.log(noValue)
 * // Output: { _id: 'Option', _tag: 'None' }
 * ```
 *
 * @see {@link some} for the opposite operation.
 *
 * @category Constructors
 * @since 2.0.0
 */
const none = () => none$1;
/**
 * Wraps the given value into an `Option` to represent its presence.
 *
 * **Example** (Creating an Option with a Value)
 *
 * ```ts
 * import { Option } from "effect"
 *
 * // An Option holding the number 1
 * //
 * //      ┌─── Option<number>
 * //      ▼
 * const value = Option.some(1)
 *
 * console.log(value)
 * // Output: { _id: 'Option', _tag: 'Some', value: 1 }
 * ```
 *
 * @see {@link none} for the opposite operation.
 *
 * @category Constructors
 * @since 2.0.0
 */
const some = some$1;
/**
 * Checks whether an `Option` represents the absence of a value (`None`).
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 *
 * console.log(Option.isNone(Option.some(1)))
 * // Output: false
 *
 * console.log(Option.isNone(Option.none()))
 * // Output: true
 * ```
 *
 * @see {@link isSome} for the opposite check.
 *
 * @category Guards
 * @since 2.0.0
 */
const isNone = isNone$1;
/**
 * Checks whether an `Option` contains a value (`Some`).
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 *
 * console.log(Option.isSome(Option.some(1)))
 * // Output: true
 *
 * console.log(Option.isSome(Option.none()))
 * // Output: false
 * ```
 *
 * @see {@link isNone} for the opposite check.
 *
 * @category Guards
 * @since 2.0.0
 */
const isSome = isSome$1;
/**
 * Returns the value contained in the `Option` if it is `Some`, otherwise
 * evaluates and returns the result of `onNone`.
 *
 * **Details**
 *
 * This function allows you to provide a fallback value or computation for when
 * an `Option` is `None`. If the `Option` contains a value (`Some`), that value
 * is returned. If it is empty (`None`), the `onNone` function is executed, and
 * its result is returned instead.
 *
 * This utility is helpful for safely handling `Option` values by ensuring you
 * always receive a meaningful result, whether or not the `Option` contains a
 * value. It is particularly useful for providing default values or alternative
 * logic when working with optional values.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 *
 * console.log(Option.some(1).pipe(Option.getOrElse(() => 0)))
 * // Output: 1
 *
 * console.log(Option.none().pipe(Option.getOrElse(() => 0)))
 * // Output: 0
 * ```
 *
 * @see {@link getOrNull} for a version that returns `null` instead of executing a function.
 * @see {@link getOrUndefined} for a version that returns `undefined` instead of executing a function.
 *
 * @category Getters
 * @since 2.0.0
 */
const getOrElse$1 = /*#__PURE__*/dual(2, (self, onNone) => isNone(self) ? onNone() : self.value);
/**
 * Converts a nullable value into an `Option`. Returns `None` if the value is
 * `null` or `undefined`, otherwise wraps the value in a `Some`.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 *
 * console.log(Option.fromNullable(undefined))
 * // Output: { _id: 'Option', _tag: 'None' }
 *
 * console.log(Option.fromNullable(null))
 * // Output: { _id: 'Option', _tag: 'None' }
 *
 * console.log(Option.fromNullable(1))
 * // Output: { _id: 'Option', _tag: 'Some', value: 1 }
 * ```
 *
 * @category Conversions
 * @since 2.0.0
 */
const fromNullable = nullableValue => nullableValue == null ? none() : some(nullableValue);
/**
 * Extracts the value of an `Option` or throws an error if the `Option` is
 * `None`, using a custom error factory.
 *
 * **Details**
 *
 * This function allows you to extract the value of an `Option` when it is
 * `Some`. If the `Option` is `None`, it throws an error generated by the
 * provided `onNone` function. This utility is particularly useful when you need
 * a fail-fast behavior for empty `Option` values and want to provide a custom
 * error message or object.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { Option } from "effect"
 *
 * assert.deepStrictEqual(
 *   Option.getOrThrowWith(Option.some(1), () => new Error('Unexpected None')),
 *   1
 * )
 * assert.throws(() => Option.getOrThrowWith(Option.none(), () => new Error('Unexpected None')))
 * ```
 *
 * @see {@link getOrThrow} for a version that throws a default error.
 *
 * @category Conversions
 * @since 2.0.0
 */
const getOrThrowWith = /*#__PURE__*/dual(2, (self, onNone) => {
  if (isSome(self)) {
    return self.value;
  }
  throw onNone();
});

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
const agentInitiators = new Map();
const AgentInitiatorRegistry = {
    register(agentName, agentInitiator) {
        agentInitiators.set(agentName, agentInitiator);
    },
    lookup(agentName) {
        return fromNullable(agentInitiators.get(agentName));
    },
    has(agentName) {
        return agentInitiators.has(agentName);
    },
    entries() {
        return agentInitiators.entries();
    },
};

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
const AgentNameConstructor = {
    fromString(name) {
        return name;
    },
    fromAgentClassName(agentClassName) {
        const name = agentClassName.toString();
        return name;
    },
};
const AgentClassNameConstructor = {
    fromString(name) {
        return name;
    },
};

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
const agentRegistry = new Map();
const AgentRegistry = {
    register(agentClassName, agentType) {
        agentRegistry.set(agentClassName, agentType);
    },
    entries() {
        return agentRegistry.entries();
    },
    getRegisteredAgents() {
        return Array.from(agentRegistry.values());
    },
    lookup(agentClassName) {
        return fromNullable(agentRegistry.get(agentClassName));
    },
    exists(agentClassName) {
        return agentRegistry.has(agentClassName);
    },
};

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
 * BaseAgent is the foundational class for defining agent implementations.
 *
 * All agents must extend this class and **must** be decorated with the `@Agent()` decorator.
 * Do **not** need to override the methods and manually implement them in this class.
 * The `@Agent()` decorator handles all runtime wiring (e.g., `getId()`, `createRemote()`, etc.).
 *
 * Example usage:
 *
 * ```ts
 * @Agent()
 * class AssistantAgent extends BaseAgent {
 *   @Prompt("Ask your question")
 *   @Description("This method allows the agent to answer your question")
 *   async ask(name: string): Promise<string> {
 *      return `Hello ${name}, I'm the assistant agent (${this.getId()})!`;
 *   }
 * }
 * ```
 */
class BaseAgent {
    /**
     * Returns the unique `AgentId` for this agent instance.
     *
     * This is automatically populated by the `@Agent()` decorator at runtime.
     *
     * @throws Will throw if accessed before the agent is initialized.
     */
    getId() {
        throw new Error('An agent ID will be created at runtime');
    }
    /**
     * Returns the `AgentType` metadata registered for this agent.
     *
     * This information is retrieved from the runtime agent registry and reflects
     * metadata defined via decorators like `@Agent()`, `@Prompt()`, etc.
     *
     * @throws Will throw if metadata is missing or the agent is not properly registered.
     */
    getAgentType() {
        const agentClassName = AgentClassNameConstructor.fromString(this.constructor.name);
        return getOrThrowWith(AgentRegistry.lookup(agentClassName), () => new Error(`Failed to find agent type for ${this.constructor.name}`));
    }
    /**
     * Creates a remote client instance of this agent type.
     *
     * This remote client will communicate with an agent instance running
     * in a separate container, effectively offloading computation to that remote context.
     *
     * @param args - Constructor arguments for the agent
     * @returns A remote proxy instance of the agent
     *
     * @example
     * const remoteClient = MyAgent.createRemote("arg1", "arg2") where `arg1`, `arg2` are the constructor arguments
     * validated at compile time.
     */
    static createRemote(...args) {
        throw new Error('A remote client will be created at runtime');
    }
    /**
     * Creates a local instance of the agent within the current container.
     *
     * This method is preferred over directly calling `new MyAgent(arg1, arg2)` as it ensures
     * correct initialization, agent ID assignment, etc.
     *
     * @param args - Constructor arguments for the agent
     * @returns A locally instantiated agent
     *
     * @example
     * const localClient = MyAgent.createLocal("arg1", "arg2") where `arg1`, `arg2` are the constructor arguments
     * validated at compile time.;
     */
    static createLocal(...args) {
        throw new Error('A local client will be created at runtime');
    }
}

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
class ResolvedAgent {
    constructor(agentClassName, tsAgentInternal, originalInstance) {
        this.agentClassName = agentClassName;
        this.agentInternal = tsAgentInternal;
        this.classInstance = originalInstance;
    }
    getId() {
        return this.agentInternal.getId();
    }
    invoke(methodName, args) {
        return this.agentInternal.invoke(methodName, args);
    }
    getDefinition() {
        return getOrThrowWith(AgentRegistry.lookup(this.agentClassName), () => new Error(`Agent class ${this.agentClassName} is not registered.`));
    }
}

var dist = {};

var consts = {};

var hasRequiredConsts;

function requireConsts () {
	if (hasRequiredConsts) return consts;
	hasRequiredConsts = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.TypeIds = exports.ModuleIds = exports.CALLSITE_ARGS_TYPE_PROPERTY = exports.CALLSITE_TYPE_ARGS_PROPERTY = exports.PROTOTYPE_TYPE_INSTANCE_PROPERTY = exports.PROTOTYPE_TYPE_PROPERTY = void 0;
		exports.PROTOTYPE_TYPE_PROPERTY = "[[type]]";
		exports.PROTOTYPE_TYPE_INSTANCE_PROPERTY = "[[$type]]";
		exports.CALLSITE_TYPE_ARGS_PROPERTY = "[[csTArgs]]";
		exports.CALLSITE_ARGS_TYPE_PROPERTY = "[[csArgsT]]";
		exports.ModuleIds = {
		    Native: "::native",
		    Dynamic: "::dynamic",
		    Invalid: "::invalid",
		    RttistType: "@rttist/dist/Type",
		    RttistModule: "@rttist/dist/Module",
		};
		exports.TypeIds = {
		    Invalid: `${exports.ModuleIds.Invalid}::Invalid`,
		    NonPrimitiveObject: "#object",
		    Function: "#Function",
		    Any: "#any",
		    Unknown: "#unknown",
		    Void: "#void",
		    Never: "#never",
		    Null: "#null",
		    Undefined: "#undefined",
		    Intrinsic: "#intrinsic",
		    String: "#String",
		    Number: "#Number",
		    BigInt: "#BigInt",
		    Boolean: "#Boolean",
		    True: "#true",
		    False: "#false",
		    Date: "#Date",
		    Error: "#Error",
		    Symbol: "#Symbol",
		    UniqueSymbol: "#UniqueSymbol",
		    RegExp: "#RegExp",
		    Int8Array: "#Int8Array",
		    Uint8Array: "#Uint8Array",
		    Uint8ClampedArray: "#Uint8ClampedArray",
		    Int16Array: "#Int16Array",
		    Uint16Array: "#Uint16Array",
		    Int32Array: "#Int32Array",
		    Uint32Array: "#Uint32Array",
		    Float32Array: "#Float32Array",
		    Float64Array: "#Float64Array",
		    BigInt64Array: "#BigInt64Array",
		    BigUint64Array: "#BigUint64Array",
		    ArrayDefinition: "#Array",
		    TupleDefinition: "#Tuple",
		    ReadonlyArrayDefinition: "#ReadonlyArray",
		    MapDefinition: "#Map",
		    WeakMapDefinition: "#WeakMap",
		    SetDefinition: "#Set",
		    WeakSetDefinition: "#WeakSet",
		    PromiseDefinition: "#Promise",
		    GeneratorDefinition: "#Generator",
		    AsyncGeneratorDefinition: "#AsyncGenerator",
		    IteratorDefinition: "#Iterator",
		    IterableDefinition: "#Iterable",
		    IterableIteratorDefinition: "#IterableIterator",
		    AsyncIteratorDefinition: "#AsyncIterator",
		    AsyncIterableDefinition: "#AsyncIterable",
		    AsyncIterableIteratorDefinition: "#AsyncIterableIterator",
		    ArrayBuffer: "#ArrayBuffer",
		    SharedArrayBuffer: "#SharedArrayBuffer",
		    Atomics: "#Atomics",
		    DataView: "#DataView",
		}; 
	} (consts));
	return consts;
}

var declarations = {};

var hasRequiredDeclarations;

function requireDeclarations () {
	if (hasRequiredDeclarations) return declarations;
	hasRequiredDeclarations = 1;
	Object.defineProperty(declarations, "__esModule", { value: true });
	return declarations;
}

var getCallsiteTypeArguments = {};

var hasRequiredGetCallsiteTypeArguments;

function requireGetCallsiteTypeArguments () {
	if (hasRequiredGetCallsiteTypeArguments) return getCallsiteTypeArguments;
	hasRequiredGetCallsiteTypeArguments = 1;
	Object.defineProperty(getCallsiteTypeArguments, "__esModule", { value: true });
	getCallsiteTypeArguments.getCallsiteTypeArguments = getCallsiteTypeArguments$1;
	const consts_1 = requireConsts();
	function getCallsiteTypeArguments$1(fn) {
	    const callsiteArgs = fn[consts_1.CALLSITE_TYPE_ARGS_PROPERTY];
	    fn[consts_1.CALLSITE_TYPE_ARGS_PROPERTY] = undefined;
	    return callsiteArgs;
	}
	return getCallsiteTypeArguments;
}

var hasRequiredDist;

function requireDist () {
	if (hasRequiredDist) return dist;
	hasRequiredDist = 1;
	(function (exports) {
		var __createBinding = (dist && dist.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __exportStar = (dist && dist.__exportStar) || function(m, exports) {
		    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		__exportStar(requireConsts(), exports);
		__exportStar(requireDeclarations(), exports);
		__exportStar(requireGetCallsiteTypeArguments(), exports); 
	} (dist));
	return dist;
}

var distExports = requireDist();

var m={current:null,setScope(n){this.current=n;},doWithScope(n,e){let t=this.current;this.setScope(n);try{e();}finally{this.setScope(t);}}};var Se=null;function We(n){Se=n;}function j(){if(!Se)throw new Error("Type factory is not set");return Se}var Le=null;function Ye(n){Le=n;}function qe(){if(!Le)throw new Error("Type factory is not set");return Le}function*Re(){for(let n=0;n<100;n++)yield distExports.TypeIds.Invalid;}function ve(n,e,t){let a=n[distExports.CALLSITE_TYPE_ARGS_PROPERTY];if(n[distExports.CALLSITE_TYPE_ARGS_PROPERTY]=void 0,e!==void 0);return a||Re()}var De=Symbol.for("rttist/Type"),ke=Symbol.for("rttist/Module");function G(n){return n&&typeof n=="object"&&n.constructor.__type===De}function $(n){return n&&typeof n=="object"&&n.constructor.__type===ke}var W=class{constructor(e){this.metadataLibrary=m.current;if(!e)throw new Error("Invalid module reference.");this._reference=e;}get module(){return this._module??(this._module=this.metadataLibrary.resolveModule(this._reference)),this._module}};var y=class{constructor(e){this.metadataLibrary=m.current;if(!e)throw new Error("Invalid type reference.");this._reference=e;}get type(){return this._type??(this._type=this.metadataLibrary.resolveType(this._reference)),this._type}};var T=class{constructor(e){this.metadataLibrary=m.current;this._references=e,this.length=e.length;}get types(){return this._types??(this._types=Object.freeze(this._references.map(e=>this.metadataLibrary.resolveType(e)))),this._types}};var u=(r=>(r[r.Invalid=0]="Invalid",r[r.Unknown=1]="Unknown",r[r.Any=2]="Any",r[r.Never=3]="Never",r[r.Void=4]="Void",r[r.Undefined=5]="Undefined",r[r.Null=6]="Null",r[r.Intrinsic=7]="Intrinsic",r[r.Boolean=8]="Boolean",r[r.False=9]="False",r[r.True=10]="True",r[r.Number=11]="Number",r[r.BigInt=12]="BigInt",r[r.String=13]="String",r[r.Symbol=14]="Symbol",r[r.NonPrimitiveObject=15]="NonPrimitiveObject",r[r.ObjectType=16]="ObjectType",r[r.FunctionType=17]="FunctionType",r[r.Date=18]="Date",r[r.Error=19]="Error",r[r.RegExp=20]="RegExp",r[r.Int8Array=21]="Int8Array",r[r.Uint8Array=22]="Uint8Array",r[r.Uint8ClampedArray=23]="Uint8ClampedArray",r[r.Int16Array=24]="Int16Array",r[r.Uint16Array=25]="Uint16Array",r[r.Int32Array=26]="Int32Array",r[r.Uint32Array=27]="Uint32Array",r[r.Float32Array=28]="Float32Array",r[r.Float64Array=29]="Float64Array",r[r.BigInt64Array=30]="BigInt64Array",r[r.BigUint64Array=31]="BigUint64Array",r[r.ArrayBuffer=32]="ArrayBuffer",r[r.SharedArrayBuffer=33]="SharedArrayBuffer",r[r.Atomics=34]="Atomics",r[r.DataView=35]="DataView",r[r.ArrayDefinition=36]="ArrayDefinition",r[r.ReadonlyArrayDefinition=37]="ReadonlyArrayDefinition",r[r.TupleDefinition=38]="TupleDefinition",r[r.MapDefinition=39]="MapDefinition",r[r.WeakMapDefinition=40]="WeakMapDefinition",r[r.SetDefinition=41]="SetDefinition",r[r.WeakSetDefinition=42]="WeakSetDefinition",r[r.PromiseDefinition=43]="PromiseDefinition",r[r.GeneratorDefinition=44]="GeneratorDefinition",r[r.AsyncGeneratorDefinition=45]="AsyncGeneratorDefinition",r[r.IteratorDefinition=46]="IteratorDefinition",r[r.IterableDefinition=47]="IterableDefinition",r[r.IterableIteratorDefinition=48]="IterableIteratorDefinition",r[r.AsyncIteratorDefinition=49]="AsyncIteratorDefinition",r[r.AsyncIterableDefinition=50]="AsyncIterableDefinition",r[r.AsyncIterableIteratorDefinition=51]="AsyncIterableIteratorDefinition",r[r.Module=60]="Module",r[r.Namespace=61]="Namespace",r[r.Object=62]="Object",r[r.Interface=63]="Interface",r[r.Class=64]="Class",r[r.Union=65]="Union",r[r.Intersection=66]="Intersection",r[r.ConditionalType=67]="ConditionalType",r[r.IndexedAccess=68]="IndexedAccess",r[r.TypeParameter=69]="TypeParameter",r[r.Alias=70]="Alias",r[r.Method=71]="Method",r[r.Function=72]="Function",r[r.GeneratorFunction=73]="GeneratorFunction",r[r.NumberLiteral=74]="NumberLiteral",r[r.BigIntLiteral=75]="BigIntLiteral",r[r.StringLiteral=76]="StringLiteral",r[r.TemplateLiteral=77]="TemplateLiteral",r[r.EnumLiteral=78]="EnumLiteral",r[r.RegExpLiteral=79]="RegExpLiteral",r[r.Enum=80]="Enum",r[r.UniqueSymbol=81]="UniqueSymbol",r[r.ESSymbol=82]="ESSymbol",r[r.Promise=83]="Promise",r[r.Generator=84]="Generator",r[r.AsyncGenerator=85]="AsyncGenerator",r[r.Iterator=86]="Iterator",r[r.Iterable=87]="Iterable",r[r.IterableIterator=88]="IterableIterator",r[r.AsyncIterator=89]="AsyncIterator",r[r.AsyncIterable=90]="AsyncIterable",r[r.AsyncIterableIterator=91]="AsyncIterableIterator",r[r.Jsx=92]="Jsx",r[r.Type=93]="Type",r[r.TypeCtor=94]="TypeCtor",r))(u||{});var C=(a=>(a[a.None=0]="None",a[a.Getter=1]="Getter",a[a.Setter=2]="Setter",a))(C||{});var S=(a=>(a[a.Public=0]="Public",a[a.Private=1]="Private",a[a.Protected=2]="Protected",a))(S||{});var we=new Set([76,74,10,9,75,79,77]),Ee=new Set([13,8,11,12,14,81,6,5]);var Pe=(t=>(t[t.ES=0]="ES",t[t.Unique=1]="Unique",t))(Pe||{});function Y(n){return ((n||0)&24)>>3}function Xe(n){return ((n||0)&96)>>5}var Ne=(a=>(a[a.None=0]="None",a[a.Optional=1]="Optional",a[a.Rest=2]="Rest",a))(Ne||{}),lt=(o=>(o[o.Optional=1]="Optional",o[o.Static=2]="Static",o[o.Private=8]="Private",o[o.Protected=16]="Protected",o))(lt||{}),Ze=(t=>(t[t.None=0]="None",t[t.Readonly=1]="Readonly",t))(Ze||{}),Oe=(d=>(d[d.None=0]="None",d[d.Optional=1]="Optional",d[d.Readonly=2]="Readonly",d[d.Static=4]="Static",d[d.Private=8]="Private",d[d.Protected=16]="Protected",d[d.Getter=32]="Getter",d[d.Setter=64]="Setter",d))(Oe||{});var L=class L{constructor(e){this._isIterable=false;this.metadataLibrary=m.current;if(!e.module)throw new Error("Type must have a module.");this._id=e.id,this._kind=e.kind,this._name=e.name,this._exported=e.exported||false,this._moduleRef=new W(e.module),this._nullable=e.nullable||this.metadataLibrary.configuration.nullability||false,this._definitionRef=e.genericTypeDefinition?new y(e.genericTypeDefinition):void 0,this._isGenericTypeDefinition=e.isGenericTypeDefinition||false,this._typeArgumentsRef=new T(e.typeArguments||[]);}get id(){return this._id}get displayName(){return `<${u[this._kind]} ${this._name} [${this._id}]>`}get kind(){return this._kind}get module(){return this._moduleRef.module}get name(){return this._name}get exported(){return this._exported}get iterable(){return this._isIterable}get nullable(){return this._nullable}get genericTypeDefinition(){return this._isGenericTypeDefinition?this:this._definitionRef?.type}[Symbol.for("nodejs.util.inspect.custom")](){return this.toString()}is(e){if(e===void 0){let[t]=ve(this.is);e=this.metadataLibrary.resolveType(t);}return this._id===e._id}getTypeArguments(){return this._typeArgumentsRef.types}isGenericType(){return this._typeArgumentsRef.length>0}isGenericTypeDefinition(){return this._isGenericTypeDefinition}isTypeParameter(){return this._kind===69}isUnion(){return this._kind===65}isIntersection(){return this._kind===66}isClass(){return this._kind===64}isInterface(){return this._kind===63}isTypeAlias(){return this._kind===70}isLiteral(){return we.has(this._kind)}isUnionOrIntersection(){return this.isUnion()||this.isIntersection()}isArray(){return this.isGenericType()&&(this.genericTypeDefinition===L.ArrayDefinition||this.genericTypeDefinition===L.ReadonlyArrayDefinition)}isTuple(){return this.isGenericType()&&this.genericTypeDefinition===L.TupleDefinition}isEnum(){return this._kind===80}isConditional(){return this._kind===67}isObjectLike(){return this.isObject()||this.isClass()||this.isInterface()}isObject(){return this._kind===62}isTemplate(){return this._kind===77}isFunction(){return this._kind===72}isESSymbol(){return this._kind===82}isUniqueSymbol(){return this._kind===81}isInstantiable(){return this.isClass()||this.isFunction()}isPrimitive(){return Ee.has(this._kind)}isString(){return this._kind===13||this._kind===76||this._kind===77}isNumber(){return this._kind===11||this._kind===74}isBigInt(){return this._kind===12||this._kind===75}isBoolean(){return this._kind===8||this._kind===10||this._kind===9}isAny(){return this._kind===2}isNever(){return this._kind===3}isVoid(){return this._kind===4}isIntrinsic(){return this._kind===7}isUndefined(){return this._kind===5}isNull(){return this._kind===6}toString(){let e=this.getPropsToStringify();return `${this.displayName} {
    \`\`\`typeinfo
    typelib: ${this.metadataLibrary.name}
    module:  ${this.module.id}
    \`\`\``+(e.length?`
`:"")+this.stringifyProps(e,1)+`
}`}getPropsToStringify(){return []}stringifyProps(e,t){let a="    ".repeat(t);return e.map(o=>(Array.isArray(o)?this.stringifyProps(o,1):o).replace(/^/gm,a)).join(`
`)}};L.__type=De;var i=L;function V(){return typeof globalThis=="object"?globalThis:typeof window=="object"?window:global}function J(n,e){let t=V(),a=Symbol.for(n);return t[a]||(t[a]=e())}var Ue=class{constructor(){this.importMap={};}registerImporters(e){Object.keys(e).forEach(t=>{this.importMap[t]=e[t];});}import(e){return this.importMap[e]?.()??Promise.resolve(void 0)}},Ge=J("rttist/ModuleImporter",()=>new Ue);var H=class{constructor(e){this.metadataLibrary=m.current;this._references=e,this.length=e.length;}get modules(){return this._modules??(this._modules=Object.freeze(this._references.map(e=>this.metadataLibrary.resolveModule(e)))),this._modules}};var c=class{get id(){return this._id}constructor(e){this._id=e.id,this._import=e.import??(()=>Ge.import(e.id)),this.name=e.name,this.path=e.path,this._childrenRefs=new H(e.children||[]),this._types=Object.freeze((e.types||[]).map(t=>(t.module=e.id,j().create(t))));}getChildren(){return this._childrenRefs.modules}getTypes(){return this._types}import(){return this._import()}};c.__type=ke;var b=class{constructor(e){this.metadata=e,this.name=e.name,this.id=e.id,this._args=Object.freeze(e.args||[]);}getArguments(){return this._args}is(e){return e.id===this.id}};var X=class{get keyType(){return this._keyTypeRef.type}get type(){return this._typeRef.type}constructor(e){this.metadata=e,this._keyTypeRef=new y(e.key),this._typeRef=new y(e.type),this.readonly=(e.flags&1)!==0;}};var R=class{constructor(e){if(typeof e=="object"){if(this.key=e.key,this.kind=e.kind,e.kind===0){this.name=Symbol[e.key];return}this.name=Symbol.for(e.key);return}this.name=e;}isString(){return typeof this.name=="string"}isNumber(){return typeof this.name=="number"}isSymbol(){return typeof this.name=="symbol"}toString(){return this.isSymbol()?`Symbol.for('${this.key}')`:this.name.toString()}};var Q=class{get type(){return this._type.type}constructor(e){this.name=e.name,this._type=new y(e.type),this.optional=(e.flags&1)!==0,this.rest=(e.flags&2)!==0,this._decorators=Object.freeze((e.decorators||[]).map(t=>new b(t)));}getDecorators(){return this._decorators}toString(){return this.getDecorators().map(e=>"@"+e.name).join(" ")+(this.rest?"...":"")+`${this.name.toString()}${this.optional?"?":""}: ${this.type.displayName}`}};var I=class{get returnType(){return this._returnTypeRef.type}constructor(e){this.metadata=e,this._parameters=Object.freeze((e.parameters||[]).map(t=>new Q(t))),this._typeParametersRef=new T(e.typeParameters||[]),this._returnTypeRef=new y(e.returnType);}getParameters(){return this._parameters}getTypeParameters(){return this._typeParametersRef.types}toString(){return `(${this._parameters.map(t=>t.toString()).join(", ")}): ${this.returnType.displayName}`}};var Z=class{get name(){return this._name}get optional(){return this._optional}get accessModifier(){return this._accessModifier}constructor(e){this.metadata=e,this._name=new R(e.name),this._signatures=Object.freeze((e.signatures||[]).map(t=>new I(t))),this._decorators=Object.freeze((e.decorators||[]).map(t=>new b(t))),this._accessModifier=Y(e.flags),this._optional=(e.flags&1)!==0;}getDecorators(){return this._decorators}getSignatures(){return this._signatures}toString(){let e=this._signatures.map(t=>(this._accessModifier?S[this._accessModifier]+" ":"")+this._name.toString()+(this._optional?"?":"")+t.toString()).join(`
`);return this._decorators.map(t=>"@"+t.name).join(`
`)+e}};var z=class{get type(){return this._type.type}constructor(e){this.name=new R(e.name),this._type=new y(e.type),this._decorators=Object.freeze((e.decorators||[]).map(t=>new b(t))),this.metadata=e,this.accessModifier=Y(e.flags),this.accessor=Xe(e.flags),this.optional=(e.flags&1)!==0,this.readonly=(e.flags&2)!==0;}getDecorators(){return this._decorators}toString(){return this.getDecorators().map(e=>"@"+e.name).join(" ")+(this.accessor?C[this.accessor]+" ":"")+(this.accessModifier?S[this.accessModifier]+" ":"")+(this.readonly?"readonly ":"")+`${this.name.toString()}${this.optional?"?":""}: ${this.type.displayName}`}};function K(n){return Object.freeze((n.signatures||[]).map(e=>new I(e)))}function ze(n){return Object.freeze((n.properties||[]).map(e=>new z(e)))}function Ke(n){return Object.freeze((n.methods||[]).map(e=>new Z(e)))}function et(n){return Object.freeze((n.indexes||[]).map(e=>new X(e)))}var M=class extends i{constructor(e){super(e),this._properties=ze(e),this._methods=Ke(e),this._indexes=et(e),this._isIterable=this._properties?.some(t=>t.name.isSymbol()&&t.name.name===Symbol.iterator)||this._methods?.some(t=>t.name.isSymbol()&&t.name.name===Symbol.iterator);}getProperties(){return this._properties}getProperty(e){return this._properties.find(t=>t.name.name===e)}getIndexes(){return this._indexes}getMethods(){return this._methods}getMethod(e){return this._methods.find(t=>t.name.name===e)}getPropsToStringify(){return [...this._properties.map(e=>e.toString()),...this._methods.map(e=>e.toString())]}};var v=class extends M{get extends(){return this._extendsRef?.type}get implements(){return this._implementsRef.types}get abstract(){return this._abstract}constructor(e){super(e),this._ctor=e.ctor??(()=>this.module.import().then(t=>t?.[e.name])),this._implementsRef=new T(e.implements||[]),this._extendsRef=e.extends===void 0?void 0:new y(e.extends),this._constructors=Object.freeze((e.constructors??[]).map(t=>new I(t))),this._decorators=Object.freeze((e.decorators??[]).map(t=>new b(t))),this._abstract=e.abstract??false;}getCtor(){return this._ctor()}getConstructors(){return this._constructors}getDecorators(){return this._decorators}isSubclassOf(e){return e.isClass()&&(this.extends!==void 0&&(this.extends.is(e)||this.extends.isClass()&&this.extends.isSubclassOf(e)||this.extends.isGenericType()&&this.extends.genericTypeDefinition.isClass()&&this.extends.genericTypeDefinition.isSubclassOf(e))||this.isGenericType()&&(this.genericTypeDefinition.is(e)||this.genericTypeDefinition?.isClass()&&this.genericTypeDefinition.isSubclassOf(e)))}isDerivedFrom(e){return this.is(e)||this.extends?.isDerivedFrom(e)||this.implements.some(t=>t.isInterface()?t.isDerivedFrom(e):t.is(e))||false}};var ee=class extends i{get extends(){return this._extendsRef.type}get trueType(){return this._trueTypeRef.type}get falseType(){return this._falseTypeRef.type}constructor(e){super(e),this._extendsRef=new y(e.extends),this._trueTypeRef=new y(e.trueType),this._falseTypeRef=new y(e.falseType);}};var te=class extends i{constructor(e){super(e),this._entries=Object.entries(e.entries||{}).map(([t,a])=>Object.freeze([t,a]));}getEnumerators(){return this.getEntries().map(e=>e[0])}getValues(){return this.getEntries().map(e=>e[1])}getEntries(){return this._entries.slice()}};var D=class extends i{constructor(e){super(e),this._signatures=K(e);}getSignatures(){return this._signatures}};var re=class extends i{constructor(e){super(e),this._signatures=K(e);}getSignatures(){return this._signatures}};var ne=class extends M{get extends(){return this._extendsRef.types}constructor(e){super(e),this._extendsRef=new T(e.extends||[]);}isDerivedFrom(e){return this.is(e)||this.extends.some(t=>t.isInterface()?t.isDerivedFrom(e):t.is(e))||false}};var k=class extends i{get types(){return this._types.types}constructor(e){super(e),this._types=new T(e.types||[]);}toString(){return `${this.types.map(e=>e.toString()).join(this.operatorSymbol)}`}};var w=class extends k{constructor(t){super(t);this.operatorSymbol=" & ";}};var A=class extends i{constructor(e){super(e),this.value=this.parseValue(e.value);}isStringLiteral(){return this._kind===76}isNumberLiteral(){return this._kind===74}isBooleanLiteral(){return this._kind===10||this._kind===9}isBigIntLiteral(){return this._kind===75}isRegExpLiteral(){return this._kind===79}isTrue(){return this.kind===10}isFalse(){return this.kind===9}parseValue(e){switch(this._kind){case 76:return e+"";case 74:return Number(e);case 9:case 10:return e==="true"||e===true;case 75:return BigInt(e[e.length-1]==="n"?e.slice(0,-1):e);case 79:return new RegExp(e)}return e}toString(){return `${u[this._kind]}(${this.value})`}};var ae=class extends M{constructor(e){super(e);}};var ie=class extends i{constructor(e){super(e),this.head=e.head,this.templateSpans=e.templateSpans;}};var oe=class extends i{get constraint(){return this._constraint?.type}get default(){return this._default?.type}constructor(e){super(e),this._constraint=e.constraint?new y(e.constraint):void 0,this._default=e.default?new y(e.default):void 0;}};var E=class extends k{constructor(t){super(t);this.operatorSymbol=" | ";}};var se=class extends i{get key(){return this._key}get symbol(){return this._symbol}constructor(e){super(e),this._key=e.key,this._symbol=Symbol[e.key];}toString(){return "@@"+this._key}};var pe=class extends i{get key(){return this._key}get symbol(){return this._symbol}constructor(e){super(e),this._key=e.key,e.key!==void 0&&(this._symbol=Symbol.for(e.key));}hasKey(){return this._key!==void 0}};var ye=class extends i{get target(){return this._target.type}constructor(e){super(e),this._target=new y(e.target);}getPropsToStringify(){return [`target: ${this._target.type.id}`]}};var de=class extends i{get objectType(){return this._objectTypeRef.type}get indexType(){return this._indexTypeRef.type}constructor(e){super(e),this._objectTypeRef=new y(e.objectType),this._indexTypeRef=new y(e.indexType);}};var le=class extends i{constructor(e){super(e),this.value=this.parseValue(e.value),this.enumRef=new y(e.enum);}isStringLiteral(){return this._kind===76}isNumberLiteral(){return this._kind===74}parseValue(e){switch(this._kind){case 76:return e+"";case 74:return Number(e)}return e}};var h=class extends i{get genericTypeDefinition(){return this._definitionRef.type}constructor(e,t){t.genericTypeDefinition=e,super(t);}getTypeArguments(){return this._typeArgumentsRef.types}};var P=class extends h{constructor(e){super(distExports.TypeIds.PromiseDefinition,e);}},ce=class extends h{constructor(e){super(distExports.TypeIds.ArrayDefinition,e);}},me=class extends h{constructor(e){super(distExports.TypeIds.ReadonlyArrayDefinition,e);}},fe=class extends h{constructor(e){super(distExports.TypeIds.SetDefinition,e);}},ue=class extends h{constructor(e){super(distExports.TypeIds.WeakSetDefinition,e);}},Te=class extends h{constructor(e){super(distExports.TypeIds.MapDefinition,e);}},he=class extends h{constructor(e){super(distExports.TypeIds.WeakMapDefinition,e);}},be=class extends h{constructor(e){super(distExports.TypeIds.TupleDefinition,e);}};var ge=class extends i{};var Ae=class extends i{};var ct=1,Ie=class{static create(e,t,a){return new v({kind:64,id:`${ct++}#${e}`,name:t.name,typeArguments:a.map(p=>p.id),module:t.module.id,properties:t.getProperties().map(p=>p.metadata),indexes:t.getIndexes().map(p=>p.metadata),methods:t.getMethods().map(p=>p.metadata),constructors:t.getConstructors().map(p=>p.metadata),decorators:t.getDecorators(),ctor:t.getCtor,extends:t.extends?.id,exported:t.exported,implements:t.implements.map(p=>p.id),nullable:t.nullable,isGenericTypeDefinition:false,genericTypeDefinition:t.id,abstract:t.abstract})}};function mt(n){switch(n.kind){case 74:case 75:case 76:case 79:return new A(n);case 77:return new ie(n);case 81:return new pe(n);case 82:return new se(n);case 62:return new ae(n);case 63:return new ne(n);case 64:return new v(n);case 69:return new oe(n);case 70:return new ye(n);case 67:return new ee(n);case 68:return new de(n);case 60:return new Ae(n);case 61:return new ge(n);case 65:return new E(n);case 66:return new w(n);case 72:return new D(n);case 73:return new re(n);case 80:return new te(n);case 78:return new le(n);case 83:return new P(n)}return console.warn("Creating Type of unknown TypeKind.",n),new i(n)}var Me=class{static create(e){return mt(e)}};var xe=class n{constructor(e){this.metadataLibrary=e;this.createdTypes={};}getGenericClass(e,t){let a=this.metadataLibrary.getType(e);if(!a.isClass())return console.error("GenericTypeRegister.getGenericClass called for type which is not a ClassType."),class{};let o=n.getId(a,t),p=this.createdTypes[o];if(!p){let g=`${e.name}{${t.map(d=>d.name).join(",")}}`;this.createdTypes[o]=p={[g]:class extends e{}}[g];let f=qe().create(o,a,t);this.metadataLibrary.addType(f),p.prototype[distExports.PROTOTYPE_TYPE_INSTANCE_PROPERTY]=f,p.prototype[distExports.PROTOTYPE_TYPE_PROPERTY]=f.id;}return p}static getId(e,t){return `${e.id}{${t.map(a=>a.id).join(",")}}`}};var tt=false,Ce,rt,nt={},l={};function F(){return tt||(Ce=new i({kind:63,name:"Array",id:`#Array{${distExports.TypeIds.Any}}`,module:distExports.ModuleIds.Native,genericTypeDefinition:"#Array",typeArguments:[distExports.TypeIds.Any]}),rt=new D({kind:72,name:"Function",id:"#Function:unknown",module:distExports.ModuleIds.Native,signatures:[{parameters:[{name:"x",flags:2,type:Ce.id}],returnType:distExports.TypeIds.Unknown}]}),l={ArrayDefinition:s("Array","ArrayDefinition"),ReadonlyArrayDefinition:s("ReadonlyArray","ReadonlyArrayDefinition"),TupleDefinition:s("Tuple","TupleDefinition"),MapDefinition:s("Map","MapDefinition"),WeakMapDefinition:s("WeakMap","WeakMapDefinition"),SetDefinition:s("Set","SetDefinition"),WeakSetDefinition:s("WeakSet","WeakSetDefinition"),PromiseDefinition:s("Promise","PromiseDefinition"),GeneratorDefinition:s("Generator","GeneratorDefinition"),AsyncGeneratorDefinition:s("AsyncGenerator","AsyncGeneratorDefinition"),IteratorDefinition:s("Iterator","IteratorDefinition"),IterableDefinition:s("Iterable","IterableDefinition"),IterableIteratorDefinition:s("IterableIterator","IterableIteratorDefinition"),AsyncIteratorDefinition:s("AsyncIterator","AsyncIteratorDefinition"),AsyncIterableDefinition:s("AsyncIterable","AsyncIterableDefinition"),AsyncIterableIteratorDefinition:s("AsyncIterableIterator","AsyncIterableIteratorDefinition")},nt={Invalid:s("Invalid","Invalid",distExports.ModuleIds.Invalid),NonPrimitiveObject:s("object","NonPrimitiveObject"),Any:s("any","Any"),Unknown:s("unknown","Unknown"),Void:s("void","Void"),Never:s("never","Never"),Null:s("null","Null"),Undefined:s("undefined","Undefined"),Intrinsic:s("intrinsic","Intrinsic"),String:s("String","String"),Number:s("Number","Number"),BigInt:s("BigInt","BigInt"),Boolean:s("Boolean","Boolean"),True:new A({id:distExports.TypeIds.True,kind:10,name:"true",module:distExports.ModuleIds.Native,value:true}),False:new A({id:distExports.TypeIds.False,kind:9,name:"false",module:distExports.ModuleIds.Native,value:false}),Date:s("Date","Date"),Error:s("Error","Error"),Symbol:s("Symbol","Symbol"),UniqueSymbol:s("UniqueSymbol","UniqueSymbol"),RegExp:s("RegExp","RegExp"),Int8Array:s("Int8Array","Int8Array"),Uint8Array:s("Uint8Array","Uint8Array"),Uint8ClampedArray:s("Uint8ClampedArray","Uint8ClampedArray"),Int16Array:s("Int16Array","Int16Array"),Uint16Array:s("Uint16Array","Uint16Array"),Int32Array:s("Int32Array","Int32Array"),Uint32Array:s("Uint32Array","Uint32Array"),Float32Array:s("Float32Array","Float32Array"),Float64Array:s("Float64Array","Float64Array"),BigInt64Array:s("BigInt64Array","BigInt64Array"),BigUint64Array:s("BigUint64Array","BigUint64Array"),ArrayBuffer:s("ArrayBuffer","ArrayBuffer"),SharedArrayBuffer:s("SharedArrayBuffer","SharedArrayBuffer"),Atomics:s("Atomics","Atomics"),DataView:s("DataView","DataView"),ArrayDefinition:l.ArrayDefinition,ReadonlyArrayDefinition:l.ReadonlyArrayDefinition,TupleDefinition:l.TupleDefinition,MapDefinition:l.MapDefinition,WeakMapDefinition:l.WeakMapDefinition,SetDefinition:l.SetDefinition,WeakSetDefinition:l.WeakSetDefinition,PromiseDefinition:l.PromiseDefinition,GeneratorDefinition:l.GeneratorDefinition,AsyncGeneratorDefinition:l.AsyncGeneratorDefinition,IteratorDefinition:l.IteratorDefinition,IterableDefinition:l.IterableDefinition,IterableIteratorDefinition:l.IterableIteratorDefinition,AsyncIteratorDefinition:l.AsyncIteratorDefinition,AsyncIterableDefinition:l.AsyncIterableDefinition,AsyncIterableIteratorDefinition:l.AsyncIterableIteratorDefinition},tt=true),{AnyArray:Ce,UnknownFunction:rt,nativeTypes:nt,nativeGenericTypeDefinitions:l}}function s(n,e,t=distExports.ModuleIds.Native){let a=u[e],o=distExports.TypeIds[e],p=e.endsWith("Definition");if(o===void 0||a===void 0)throw new Error(`Invalid prop name. kind = ${a}, id = ${o}`);return new i({kind:a,name:n,id:o,module:t,isGenericTypeDefinition:p})}function it(n,e){if(n===void 0)return i.Undefined;if(n===null)return i.Null;if(typeof n=="string")return i.String;if(typeof n=="symbol")return i.Symbol;if(typeof n=="number")return i.Number;if(typeof n=="boolean")return i.Boolean;if(typeof n=="bigint")return i.BigInt;if(n instanceof Date)return i.Date;if(n instanceof Error)return i.Error;if(n instanceof RegExp)return i.RegExp;if(n instanceof Int8Array)return i.Int8Array;if(n instanceof Uint8Array)return i.Uint8Array;if(n instanceof Uint8ClampedArray)return i.Uint8ClampedArray;if(n instanceof Int16Array)return i.Int16Array;if(n instanceof Uint16Array)return i.Uint16Array;if(n instanceof Int32Array)return i.Int32Array;if(n instanceof Uint32Array)return i.Uint32Array;if(n instanceof Float32Array)return i.Float32Array;if(n instanceof Float64Array)return i.Float64Array;if(n instanceof BigInt64Array)return i.BigInt64Array;if(n instanceof BigUint64Array)return i.BigUint64Array;if(G(n))return i.Type;if($(n))return i.Module;if(n.constructor===void 0)return i.Unknown;if(n.constructor===Object)return i.NonPrimitiveObject;if(Array.isArray(n))return F().AnyArray;let t=n.prototype?.[distExports.PROTOTYPE_TYPE_INSTANCE_PROPERTY]||n.constructor.prototype[distExports.PROTOTYPE_TYPE_INSTANCE_PROPERTY];if(t!==void 0)return t;let a=n.prototype?.[distExports.PROTOTYPE_TYPE_PROPERTY]||n.constructor.prototype[distExports.PROTOTYPE_TYPE_PROPERTY]||n[distExports.PROTOTYPE_TYPE_PROPERTY]||void 0;return a!==void 0?e.resolveType(a):typeof n=="function"?F().UnknownFunction:i.Unknown}var Be="reflect-gettype-error-disable",Tt=/^([#@][^,|&]+?)\{(.+?)}(\?)?$/,ht=new Map([["#Promise",P],["#Array",ce],["#ReadonlyArray",me],["#Set",fe],["#WeakSet",ue],["#Map",Te],["#WeakMap",he],["#Tuple",be]]),_e=class{constructor(e,t,a){this.configuration=e;this.name=t;this.parentLibrary=a;this.modules=new Map;this.types=new Map;this.genericTypeRegister=new xe(this);this.aliases=new Map;if(!a&&new.target!==U)throw new Error("Cannot instantiate new MetadataLibrary without parent.");this.isGlobalMetadataLibrary=new.target===U,this.getType=this.getType.bind(this),this.resolveType=this.resolveType.bind(this),this.getGenericClass=this.getGenericClass.bind(this),this.constructGeneric=this.constructGeneric.bind(this);}asExpandable(){return this}toString(){return `${this.name} (${this.modules.size} modules, ${this.types.size} types) ${JSON.stringify(this.configuration,void 0,4)}`}[Symbol.for("nodejs.util.inspect.custom")](){return this.toString()}getGenericClass(e,...t){if(t.length===0){let a=distExports.getCallsiteTypeArguments(this.getGenericClass);if(a?.[0]!==void 0){let o=this.resolveType(a[0]);return this.genericTypeRegister.getGenericClass(e,o.isGenericType()?o.getTypeArguments():[])}}return this.genericTypeRegister.getGenericClass(e,t)}constructGeneric(e,t,a,o){let p=this.getGenericClass(e,...t.map(g=>G(g)?g:this.resolveType(g)));return o!==void 0&&(o=this.inheritNewTarget(o,p)),Reflect.construct(p,a,o??p)}inheritNewTarget(e,t){let a=e.name!==void 0?`${e.name}{}`:t.name,o={[a]:class{}}[a];return Object.setPrototypeOf(o.prototype,e.prototype),o.prototype[distExports.PROTOTYPE_TYPE_PROPERTY]=t.prototype[distExports.PROTOTYPE_TYPE_PROPERTY],o}findType(e){for(let[t,a]of this.types)if(e(a))return a;if(this.parentLibrary!==void 0)return this.parentLibrary.findType(e)}getTypes(){return Array.from(this.types.values()).concat(this.parentLibrary?.getTypes()??[])}findModule(e){for(let[t,a]of this.modules)if(e(a))return a;if(this.parentLibrary!==void 0)return this.parentLibrary.findModule(e)}getModules(){return Array.from(this.modules.values()).concat(this.parentLibrary?.getModules()??[])}resolveType(e){if(!e)throw new Error("Invalid type reference.");let t=this.types.get(e)??this.parentLibrary?.types.get(e);if(t!==void 0)return t;let a=this.handleAdhocType(e);return a||i.Invalid}resolveModule(e){if(!e)throw new Error("Invalid module reference.");return this.modules.get(e)??this.parentLibrary?.modules.get(e)??c.Invalid}addMetadata(e,t){if(this.parentLibrary){this.parentLibrary.addMetadata(e,t);return}m.doWithScope(this,()=>{let a=new c(e);this.addModule(a);});}clearMetadata(e){let t=`${e}/`;for(let a of this.types.keys())a.startsWith(t)&&(this.types.delete(a),this.parentLibrary?.types.delete(a));for(let a of this.modules.keys())a.startsWith(t)&&(this.modules.delete(a),this.parentLibrary?.modules.delete(a));}addModule(...e){if(this.parentLibrary){this.parentLibrary.addModule(...e);return}for(let t of e){if(!$(t))throw new Error("Given module is not an instance of the Module class.");if(t.id!==distExports.ModuleIds.Native&&t.id!==distExports.ModuleIds.Invalid&&this.modules.has(t.id))throw new Error(`Module with id '${t.id}' already exists.`);this.modules.set(t.id,t),this.addType(...t.getTypes());}}addType(...e){if(this.parentLibrary){this.parentLibrary.addType(...e);return}for(let t of e){if(!G(t))throw new Error("Given type is not an instance of the Type class.");if(!t.id)throw new Error("Given type has invalid id.");if(this.types.has(t.id)){if(t.id.slice(0,distExports.ModuleIds.Native.length)===distExports.ModuleIds.Native)continue;return}this.types.set(t.id,t);}}addAliases(e){if(this.parentLibrary){this.parentLibrary.addAliases(e);return}for(let[t,a]of Object.entries(e))this.aliases.set(t,a);}getType(...e){if(e.length)return it(e[0],this);let t=distExports.getCallsiteTypeArguments(this.getType);return t!==void 0?t.length===0||t[0]===void 0?i.Invalid:this.resolveType(t[0]):(V()[Be]||console.debug("[ERR] RTTIST: You are calling `getType()` function directly. More information at https://github.com/rttist/rttist/issues/17. To suppress this message, create field '"+Be+"' in global object (window | global | globalThis) eg. `window['"+Be+"'] = true;`"),i.Invalid)}createLiteralType(e){let t=e.slice(3,-1),a=t[t.length-1]==="n"?75:t[0]==="'"?76:t==="true"?10:t==="false"?9:t[0]==="/"?79:74;return new A({id:e,value:a===76?t.slice(1,-1):t,kind:a,module:distExports.ModuleIds.Native,name:t})}getTypeIdInfo(e){let t=e.match(Tt);if(t)return {type:t[1],arguments:t[2].split(","),nullable:t[3]==="?"}}handleAdhocType(e){if(e.slice(0,3)==="#L("){let o=this.createLiteralType(e);return this.addType(o),o}let t=this.getTypeIdInfo(e);if(!t)return;if(t.type==="#|"||t.type==="#&"){let o=new(t.type==="#|"?E:w)({id:e,module:distExports.ModuleIds.Native,name:t.type,kind:65,types:t.arguments,nullable:t.nullable});return this.addType(o),o}let a=ht.get(t.type);if(a){let o=new a({id:e,module:distExports.ModuleIds.Native,name:`${t.type.slice(1)}<'${t.arguments.length}>`,kind:93,typeArguments:t.arguments.map(p=>p)});return this.addType(o),o}if(t.type[0]==="@"){let o=new i({id:e,module:distExports.ModuleIds.Native,name:`${t.type.slice(1)}<'${t.arguments.length}>`,kind:93,typeArguments:t.arguments.map(p=>p),genericTypeDefinition:t.type});return this.addType(o),o}}},U=class extends _e{constructor(e){super(e,"Global metadata library");}};var B=J("rttist/Metadata",()=>new U({nullability:false}));We(Me);Ye(Ie);m.setScope(B);var{nativeTypes:pt,nativeGenericTypeDefinitions:Mt,AnyArray:xt,UnknownFunction:_t}=F();for(let[n,e]of Object.entries(pt).concat(Object.entries(Mt)))i[n]=e;c.Invalid=new c({id:distExports.ModuleIds.Invalid,name:"invalid",path:""});c.Dynamic=new c({id:distExports.ModuleIds.Dynamic,name:"dynamic",path:""});c.Native=new c({id:distExports.ModuleIds.Native,name:"native",path:""});B.addType(...Object.values(pt));B.addType(xt,_t);B.addModule(c.Native,c.Invalid,c.Dynamic);

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
const PackageName = '@golemcloud/golem-ts-sdk';
const Metadata = new _e({
    nullability: false,
}, PackageName, B);
const TypeMetadata = {
    update(metadata) {
        Metadata.clearMetadata(PackageName);
        metadata.forEach((mod) => mod.add(Metadata, false));
    },
    lookupClassMetadata(className) {
        const types = Metadata.getTypes().filter((type) => type.isClass() && type.name === className.toString());
        if (types.length === 0) {
            return none();
        }
        return some(types[0]);
    },
};

/**
 * @since 2.0.0
 */
/**
 * Constructs a new `Either` holding a `Right` value. This usually represents a successful value due to the right bias
 * of this structure.
 *
 * @category constructors
 * @since 2.0.0
 */
const right = right$1;
/**
 * Constructs a new `Either` holding a `Left` value. This usually represents a failure, due to the right-bias of this
 * structure.
 *
 * @category constructors
 * @since 2.0.0
 */
const left = left$1;
/**
 * Determine if a `Either` is a `Left`.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { Either } from "effect"
 *
 * assert.deepStrictEqual(Either.isLeft(Either.right(1)), false)
 * assert.deepStrictEqual(Either.isLeft(Either.left("a")), true)
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
const isLeft = isLeft$1;
/**
 * Determine if a `Either` is a `Right`.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { Either } from "effect"
 *
 * assert.deepStrictEqual(Either.isRight(Either.right(1)), true)
 * assert.deepStrictEqual(Either.isRight(Either.left("a")), false)
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
const isRight = isRight$1;
/**
 * Converts a `Either` to an `Option` discarding the value.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { Either, Option } from "effect"
 *
 * assert.deepStrictEqual(Either.getLeft(Either.right('ok')), Option.none())
 * assert.deepStrictEqual(Either.getLeft(Either.left('err')), Option.some('err'))
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
const getLeft = getLeft$1;
/**
 * Maps the `Right` side of an `Either` value to a new `Either` value.
 *
 * @category mapping
 * @since 2.0.0
 */
const map = /*#__PURE__*/dual(2, (self, f) => isRight(self) ? right(f(self.right)) : left(self.left));
/**
 * Returns the wrapped value if it's a `Right` or a default value if is a `Left`.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { Either } from "effect"
 *
 * assert.deepStrictEqual(Either.getOrElse(Either.right(1), (error) => error + "!"), 1)
 * assert.deepStrictEqual(Either.getOrElse(Either.left("not a number"), (error) => error + "!"), "not a number!")
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
const getOrElse = /*#__PURE__*/dual(2, (self, onLeft) => isLeft(self) ? onLeft(self.left) : self.right);
/**
 * @category sequencing
 * @since 2.0.0
 */
const flatMap = /*#__PURE__*/dual(2, (self, f) => isLeft(self) ? left(self.left) : f(self.right));
/**
 * @category zipping
 * @since 2.0.0
 */
const zipWith = /*#__PURE__*/dual(3, (self, that, f) => flatMap(self, r => map(that, r2 => f(r, r2))));
/**
 * Takes a structure of `Either`s and returns an `Either` of values with the same structure.
 *
 * - If a tuple is supplied, then the returned `Either` will contain a tuple with the same length.
 * - If a struct is supplied, then the returned `Either` will contain a struct with the same keys.
 * - If an iterable is supplied, then the returned `Either` will contain an array.
 *
 * @example
 * ```ts
 * import * as assert from "node:assert"
 * import { Either } from "effect"
 *
 * assert.deepStrictEqual(Either.all([Either.right(1), Either.right(2)]), Either.right([1, 2]))
 * assert.deepStrictEqual(Either.all({ right: Either.right(1), b: Either.right("hello") }), Either.right({ right: 1, b: "hello" }))
 * assert.deepStrictEqual(Either.all({ right: Either.right(1), b: Either.left("error") }), Either.left("error"))
 * ```
 *
 * @category combining
 * @since 2.0.0
 */
// @ts-expect-error
const all = input => {
  if (Symbol.iterator in input) {
    const out = [];
    for (const e of input) {
      if (isLeft(e)) {
        return e;
      }
      out.push(e.right);
    }
    return right(out);
  }
  const out = {};
  for (const key of Object.keys(input)) {
    const e = input[key];
    if (isLeft(e)) {
      return e;
    }
    out[key] = e.right;
  }
  return right(out);
};

function isInBuiltResult(type) {
    return type.name.startsWith("@golemcloud/golem-ts-sdk") &&
        type.name.endsWith('Either<\'2>');
}

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
function constructWitValueFromTsValue(tsValue, tsType) {
    return map(constructValueFromTsValue(tsValue, tsType), constructWitValueFromValue);
}
// Note that we take `type: Type` instead of `type: AnalysedType`(because at this point `AnalysedType` of the `tsValue` is also available)
// as `Type` holds more information, and can be used to determine the error messages for wrong `tsValue` more accurately.
function constructValueFromTsValue(tsValue, type) {
    switch (type.kind) {
        case u.Null:
            return right({ kind: 'tuple', value: [] });
        case u.Boolean:
            return handleBooleanType(tsValue);
        case u.False:
            return handleBooleanType(tsValue);
        case u.True:
            return handleBooleanType(tsValue);
        case u.Number:
            if (typeof tsValue === 'number') {
                return right({ kind: 's32', value: tsValue });
            }
            else {
                return left(invalidTypeError(tsValue, 'number'));
            }
        case u.BigInt:
            if (typeof tsValue === 'bigint' || typeof tsValue === 'number') {
                return right({ kind: 'u64', value: tsValue });
            }
            else {
                return left(invalidTypeError(tsValue, 'bigint'));
            }
        case u.String:
            if (typeof tsValue === 'string') {
                return right({ kind: 'string', value: tsValue });
            }
            else {
                return left(invalidTypeError(tsValue, 'string'));
            }
        case u.PromiseDefinition:
            const promiseDefType = type;
            const promiseDefArgType = promiseDefType.getTypeArguments()[0];
            return constructValueFromTsValue(tsValue, promiseDefArgType);
        case u.Interface:
            return handleObject(tsValue, type);
        case u.Union: {
            return handleUnion(tsValue, type);
        }
        case u.Alias:
            const aliasType = type;
            const targetType = aliasType.target;
            return constructValueFromTsValue(tsValue, targetType);
        case u.Promise:
            const promiseType = type;
            const argument = promiseType.getTypeArguments()[0];
            return constructValueFromTsValue(tsValue, argument);
        case u.Type:
            return handleGeneralType(tsValue, type);
        case u.ObjectType:
            return handleObject(tsValue, type);
        case u.Uint8Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 'u8', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Uint8Array'));
            }
        case u.Uint8ClampedArray:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 'u8', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Uint8ClampedArray'));
            }
        case u.Int16Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 's16', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Int16Array'));
            }
        case u.Uint16Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 'u16', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Uint16Array'));
            }
        case u.Int32Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 's32', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Int32Array'));
            }
        case u.Uint32Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 'u32', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Uint32Array'));
            }
        case u.Float32Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 'f32', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Float32Array'));
            }
        case u.Float64Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'number')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 'f64', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'Float64Array'));
            }
        case u.BigInt64Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'bigint')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 's64', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'BigInt64Array'));
            }
        case u.BigUint64Array:
            if (Array.isArray(tsValue) &&
                tsValue.every((item) => typeof item === 'bigint')) {
                return right({
                    kind: 'list',
                    value: tsValue.map((item) => ({ kind: 'u64', value: item })),
                });
            }
            else {
                return left(invalidTypeError(tsValue, 'BigUint64Array'));
            }
        case u.Object:
            return handleObject(tsValue, type);
        case u.StringLiteral:
            if (typeof tsValue === 'string') {
                return right({ kind: 'string', value: tsValue });
            }
            else {
                return left(invalidTypeError(tsValue, 'string literal'));
            }
        default:
            return left(unexpectedTypeError(tsValue, type, none()));
    }
}
function handleBooleanType(tsValue) {
    if (typeof tsValue === 'boolean') {
        return right({ kind: 'bool', value: tsValue });
    }
    else {
        return left(invalidTypeError(tsValue, 'boolean'));
    }
}
function handleGeneralType(tsValue, type) {
    if (type.isArray())
        return handleArrayType(tsValue, type);
    if (type.isTuple())
        return handleTupleType(tsValue, type);
    if (type.isGenericType())
        return handleOtherComplexTypes(tsValue, type);
    return left(unexpectedTypeError(tsValue, type, some(`Unsupported TypeKind.Type: ${type.displayName}`)));
}
function handleArrayType(tsValue, type) {
    const typeArg = type.getTypeArguments?.()[0];
    if (!typeArg) {
        return left(unexpectedTypeError(tsValue, type, some('unable to infer the type of Array')));
    }
    if (!Array.isArray(tsValue)) {
        return left(invalidTypeError(tsValue, 'array'));
    }
    return map(all(tsValue.map((item) => constructValueFromTsValue(item, typeArg))), (values) => ({ kind: 'list', value: values }));
}
function handleTupleType(tsValue, type) {
    const typeArgs = type.getTypeArguments?.();
    if (!Array.isArray(tsValue)) {
        return left(invalidTypeError(tsValue, 'tuple'));
    }
    return map(all(tsValue.map((item, idx) => constructValueFromTsValue(item, typeArgs[idx]))), (values) => ({ kind: 'tuple', value: values }));
}
function handleOtherComplexTypes(tsValue, type) {
    const genericType = type;
    const name = genericType.genericTypeDefinition.name;
    if (name === 'Map')
        return handleKeyValuePairs(tsValue, type);
    if (isInBuiltResult(type))
        return handleInBuiltResult(tsValue, type);
    if (name === 'Promise')
        return handlePromiseType(tsValue, type);
    return left(unexpectedTypeError(tsValue, type, some(`Unsupported generic type: ${name}`)));
}
function handlePromiseType(tsValue, type) {
    const typeArgs = type.getTypeArguments?.();
    if (!typeArgs || typeArgs.length !== 1) {
        return left(unexpectedTypeError(tsValue, type, some(`${type.name} must have one type argument`)));
    }
    const innerType = typeArgs[0];
    return constructValueFromTsValue(tsValue, innerType);
}
function handleResultType(tsValue, okType, errorType) {
    if (typeof tsValue === 'object' &&
        tsValue !== null &&
        'tag' in tsValue &&
        'val' in tsValue) {
        if (tsValue.tag === 'ok') {
            const okTsVal = tsValue.val;
            const okValue = constructValueFromTsValue(okTsVal, okType);
            return map(okValue, (okValue) => {
                return {
                    kind: 'result',
                    value: {
                        ok: okValue,
                    },
                };
            });
        }
        else if (tsValue.tag === 'err') {
            const errTsVal = tsValue.val;
            const errValue = constructValueFromTsValue(errTsVal, errorType);
            return map(errValue, (errValue) => {
                return {
                    kind: 'result',
                    value: {
                        err: errValue,
                    },
                };
            });
        }
        else {
            return left(invalidTypeError(tsValue, 'result'));
        }
    }
    else {
        return left(invalidTypeError(tsValue, 'result'));
    }
}
function handleInBuiltResult(tsValue, genericType) {
    const okType = genericType.getTypeArguments?.()[0];
    const errorType = genericType.getTypeArguments?.()[1];
    if (!okType || !errorType) {
        return left(unexpectedTypeError(tsValue, genericType, some('Result must have two type arguments')));
    }
    return handleResultType(tsValue, okType, errorType);
}
function handleKeyValuePairs(tsValue, type) {
    const typeArgs = type.getTypeArguments?.();
    if (!typeArgs || typeArgs.length !== 2) {
        return left(unexpectedTypeError(tsValue, type, some('Map must have two type arguments')));
    }
    if (!(tsValue instanceof Map)) {
        return left(invalidTypeError(tsValue, 'Map'));
    }
    const [keyType, valueType] = typeArgs;
    if (!keyType || !valueType) {
        return left(unexpectedTypeError(tsValue, type, some('unable to infer key or value type')));
    }
    const values = all(Array.from(tsValue.entries()).map(([key, value]) => zipWith(constructValueFromTsValue(key, keyType), constructValueFromTsValue(value, valueType), (k, v) => ({ kind: 'tuple', value: [k, v] }))));
    return map(values, (value) => ({ kind: 'list', value }));
}
function handleObject(tsValue, type) {
    if (typeof tsValue !== 'object' || tsValue === null) {
        return left(invalidTypeError('object', tsValue));
    }
    const innerType = type;
    const innerProperties = innerType.getProperties();
    const values = [];
    for (const prop of innerProperties) {
        const key = prop.name.toString();
        if (!Object.prototype.hasOwnProperty.call(tsValue, key)) {
            if (prop.optional) {
                values.push({ kind: 'option' });
            }
            else if (prop.type.isString() && tsValue === '') {
                values.push({ kind: 'string', value: '' });
            }
            else if (prop.type.isNumber() && tsValue === 0) {
                values.push({ kind: 's32', value: 0 });
            }
            else if (prop.type.isBoolean() && tsValue === false) {
                values.push({ kind: 'bool', value: false });
            }
            else {
                return left(missingValueForKey(key, tsValue));
            }
            continue;
        }
        const fieldVal = constructValueFromTsValue(tsValue[key], prop.type);
        if (isLeft(fieldVal)) {
            return left(fieldVal.left);
        }
        values.push(fieldVal.right);
    }
    return right({ kind: 'record', value: values });
}
function handleUnion(tsValue, type) {
    const unionType = type;
    const possibleTypes = unionType.types;
    const typeWithIndex = findTypeOfAny(tsValue, possibleTypes);
    if (!typeWithIndex) {
        return left(unionTypeMatchError(tsValue, possibleTypes));
    }
    else {
        const innerType = typeWithIndex[0];
        return map(constructValueFromTsValue(tsValue, innerType), (result) => {
            return {
                kind: 'variant',
                caseIdx: typeWithIndex[1],
                caseValue: result,
            };
        });
    }
}
function findTypeOfAny(value, typeList) {
    for (let idx = 0; idx < typeList.length; idx++) {
        const type = typeList[idx];
        if (matchesType(value, type)) {
            return [type, idx];
        }
    }
    return undefined;
}
function matchesType(value, type) {
    switch (type.kind) {
        case u.Number:
            return typeof value === 'number';
        case u.String:
            return typeof value === 'string';
        case u.Boolean:
        case u.True:
        case u.False:
            return typeof value === 'boolean';
        case u.Null:
            return value === null;
        case u.Undefined:
            return value === undefined;
        case u.Any:
            return true;
        case u.Type:
            return matchesComplexType(value, type);
        case u.ArrayBuffer:
            return matchesArray(value, type.getTypeArguments?.()[0]);
        case u.TupleDefinition:
            return matchesTuple(value, type.getTypeArguments());
        case u.ObjectType:
        case u.Interface:
        case u.Object:
        case u.NonPrimitiveObject:
            return handleObjectMatch(value, type);
        case u.Alias:
            return matchesType(value, type.target);
        case u.Union:
            return type.types.some((t) => matchesType(value, t));
        default:
            return false;
    }
}
function matchesComplexType(value, type) {
    if (type.isArray()) {
        const elemType = type.getTypeArguments?.()[0];
        return matchesArray(value, elemType);
    }
    if (type.isTuple()) {
        return matchesTuple(value, type.getTypeArguments?.());
    }
    if (type.isGenericType()) {
        const genericType = type;
        const genericName = genericType.genericTypeDefinition.name;
        if (genericName === 'Map') {
            const [keyType, valType] = type.getTypeArguments?.() ?? [];
            if (!keyType || !valType) {
                return false;
            }
            if (!(value instanceof Map))
                return false;
            return Array.from(value.entries()).every(([k, v]) => matchesType(k, keyType) && matchesType(v, valType));
        }
        if (isInBuiltResult(type)) {
            const okType = genericType.getTypeArguments?.()[0];
            const errorType = genericType.getTypeArguments?.()[1];
            if (!okType || !errorType) {
                return false;
            }
            if (typeof value !== 'object' || value === null)
                return false;
            if ('tag' in value && 'val' in value) {
                if (value.tag === 'ok') {
                    return matchesType(value.val, okType);
                }
                else if (value.tag === 'err') {
                    return matchesType(value.val, errorType);
                }
            }
            return false;
        }
        return false;
    }
    return false;
}
function matchesTuple(value, tupleTypes) {
    if (!Array.isArray(value))
        return false;
    if (!tupleTypes)
        return false;
    if (value.length !== tupleTypes.length)
        return false;
    return value.every((v, idx) => matchesType(v, tupleTypes[idx]));
}
function matchesArray(value, elementType) {
    if (!Array.isArray(value))
        return false;
    if (!elementType)
        return true;
    return value.every((item) => matchesType(item, elementType));
}
function handleObjectMatch(value, type) {
    if (typeof value !== 'object' || value === null)
        return false;
    const objectType = type;
    const props = objectType.getProperties() ?? [];
    // Allow extra keys? If no, strict check:
    const valueKeys = Object.keys(value);
    if (valueKeys.length !== props.length)
        return false;
    for (const prop of props) {
        const key = prop.name.toString();
        const hasKey = key in value;
        if (!hasKey) {
            if (!prop.optional)
                return false;
            // Optional property missing: OK
        }
        else {
            if (!matchesType(value[key], prop.type))
                return false;
        }
    }
    return true;
}
function invalidTypeError(tsValue, expectedType) {
    return `Expected ${expectedType}, but got ${tsValue} which is of type ${typeof tsValue}`;
}
function missingValueForKey(key, tsValue) {
    return `Missing property '${key}' in ${tsValue}`;
}
function unionTypeMatchError(unionTypes, tsValue) {
    return `Value '${tsValue}' does not match any of the union types: ${unionTypes.map((t) => t.name).join(', ')}`;
}
function unexpectedTypeError(tsValue, expectedType, message) {
    const error = `Value ${JSON.stringify(tsValue)} cannot be handled. Type of this value is inferred to be ${expectedType.name}`;
    return error + (isSome(message) ? ` Reason: ${message.value}` : '');
}

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
// Note that we take `expectedType: Type` instead of `expectedType: AnalysedType`(because at this point `AnalysedType` of the `witValue`
// is also available) as `Type` holds more information, and help us have fine-grained control over the type conversion.
// Hence, we need to use `Type` instead of `AnalysedType`. Note that the output of this function is a real ts-value,
// and we need to ensure it is compatible with the `expectedType: Type`.
function constructTsValueFromWitValue(witValue, expectedType) {
    const value = constructValueFromWitValue(witValue);
    return constructTsValueFromValue(value, expectedType);
}
function constructTsValueFromValue(value, expectedType) {
    if (value === undefined) {
        return null;
    }
    // There is no option type in type-script, so take analysed type along with expected type.
    if (value.kind === 'option') {
        if (!value.value) {
            return null;
        }
        else {
            return constructTsValueFromValue(value.value, expectedType);
        }
    }
    switch (expectedType.kind) {
        case u.Null:
            return null;
        case u.Boolean:
            if (value.kind === 'bool') {
                return value.value;
            }
            else {
                throw new Error(`Expected boolean, obtained value ${value}`);
            }
        case u.False:
            if (value.kind === 'bool') {
                return value.value;
            }
            else {
                throw new Error(`Expected boolean, obtained value ${value}`);
            }
        case u.True:
            if (value.kind === 'bool') {
                return value.value;
            }
            else {
                throw new Error(`Expected boolean, obtained value ${value}`);
            }
        case u.Number:
            if (value.kind === 'f64' ||
                value.kind === 'u8' ||
                value.kind === 'u16' ||
                value.kind === 'u32' ||
                value.kind === 'u64' ||
                value.kind === 's8' ||
                value.kind === 's16' ||
                value.kind === 's32' ||
                value.kind === 's64') {
                return value.value;
            }
            else {
                throw new Error(`Expected number, obtained value ${value}`);
            }
        case u.BigInt:
            if (value.kind === 'u64') {
                return value.value;
            }
            else {
                throw new Error(`Expected bigint, obtained value ${value}`);
            }
        case u.String:
            if (value.kind === 'string') {
                return value.value;
            }
            else {
                throw new Error(`Expected string, obtained value ${value}`);
            }
        case u.NonPrimitiveObject:
            if (value.kind === 'record') {
                const fieldValues = value.value;
                const expectedTypeFields = expectedType.getProperties();
                return expectedTypeFields.reduce((acc, field, idx) => {
                    const name = field.name.toString();
                    const expectedFieldType = field.type;
                    acc[name] = constructTsValueFromValue(fieldValues[idx], expectedFieldType);
                    return acc;
                }, {});
            }
            else {
                throw new Error(`Expected object, obtained value ${value}`);
            }
        case u.ObjectType:
            if (value.kind === 'record') {
                const fieldValues = value.value;
                const expectedTypeFields = expectedType.getProperties();
                return expectedTypeFields.reduce((acc, field, idx) => {
                    const name = field.name.toString();
                    const expectedFieldType = field.type;
                    acc[name] = constructTsValueFromValue(fieldValues[idx], expectedFieldType);
                    return acc;
                }, {});
            }
            else {
                throw new Error(`Expected object, obtained value ${value}`);
            }
        case u.Date:
            if (value.kind === 'string') {
                return new Date(value.value);
            }
            else {
                throw new Error(`Expected date, obtained value ${value}`);
            }
        case u.Error:
            if (value.kind === 'result') {
                if (value.value.err !== undefined) {
                    if (value.value.err.kind === 'string') {
                        return new Error(value.value.err.value);
                    }
                    else {
                        throw new Error(`Expected error string, obtained value ${value.value.err}`);
                    }
                }
                else {
                    throw new Error(`Expected error, obtained value ${value}`);
                }
            }
            else {
                throw new Error(`Expected error, obtained value ${value}`);
            }
        case u.RegExp:
            if (value.kind === 'string') {
                return new RegExp(value.value);
            }
            else {
                throw new Error(`Expected RegExp, obtained value ${value}`);
            }
        case u.Int8Array:
            if (value.kind === 'list') {
                return new Int8Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Int8Array, obtained value ${value}`);
            }
        case u.Uint8Array:
            if (value.kind === 'list') {
                return new Uint8Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Uint8Array, obtained value ${value}`);
            }
        case u.Uint8ClampedArray:
            if (value.kind === 'list') {
                return new Uint8ClampedArray(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Uint8ClampedArray, obtained value ${value}`);
            }
        case u.Int16Array:
            if (value.kind === 'list') {
                return new Int16Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Int16Array, obtained value ${value}`);
            }
        case u.Uint16Array:
            if (value.kind === 'list') {
                return new Uint16Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Uint16Array, obtained value ${value}`);
            }
        case u.Int32Array:
            if (value.kind === 'list') {
                return new Int32Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Int32Array, obtained value ${value}`);
            }
        case u.Uint32Array:
            if (value.kind === 'list') {
                return new Uint32Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Uint32Array, obtained value ${value}`);
            }
        case u.Float32Array:
            if (value.kind === 'list') {
                return new Float32Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Float32Array, obtained value ${value}`);
            }
        case u.Float64Array:
            if (value.kind === 'list') {
                return new Float64Array(value.value.map((v) => constructTsValueFromValue(v, i.Number)));
            }
            else {
                throw new Error(`Expected Float64Array, obtained value ${value}`);
            }
        case u.BigInt64Array:
            if (value.kind === 'list') {
                return new BigInt64Array(value.value.map((v) => constructTsValueFromValue(v, i.BigInt)));
            }
            else {
                throw new Error(`Expected BigInt64Array, obtained value ${value}`);
            }
        case u.BigUint64Array:
            if (value.kind === 'list') {
                return new BigUint64Array(value.value.map((v) => constructTsValueFromValue(v, i.BigInt)));
            }
            else {
                throw new Error(`Expected BigUint64Array, obtained value ${value}`);
            }
        case u.ArrayBuffer:
            if (value.kind === 'list') {
                const byteArray = value.value.map((v) => {
                    const convertedValue = constructTsValueFromValue(v, i.Number);
                    if (typeof convertedValue !== 'number') {
                        throw new Error(`Expected number, obtained value ${convertedValue}`);
                    }
                    return convertedValue;
                });
                return new Uint8Array(byteArray).buffer;
            }
            else {
                throw new Error(`Expected ArrayBuffer, obtained value ${value}`);
            }
        case u.SharedArrayBuffer:
            if (value.kind === 'list') {
                const byteArray = value.value.map((v) => {
                    const convertedValue = constructTsValueFromValue(v, i.Number);
                    if (typeof convertedValue !== 'number') {
                        throw new Error(`Expected number, obtained value ${convertedValue}`);
                    }
                    return convertedValue;
                });
                return new Uint8Array(byteArray).buffer;
            }
            else {
                throw new Error(`Expected SharedArrayBuffer, obtained value ${value}`);
            }
        case u.DataView:
            if (value.kind === 'list') {
                const byteArray = value.value.map((v) => {
                    const convertedValue = constructTsValueFromValue(v, i.Number);
                    if (typeof convertedValue !== 'number') {
                        throw new Error(`Expected number, obtained value ${convertedValue}`);
                    }
                    return convertedValue;
                });
                return new DataView(new Uint8Array(byteArray).buffer);
            }
            else {
                throw new Error(`Expected DataView, obtained value ${value}`);
            }
        case u.Object:
            if (value.kind === 'record') {
                const fieldValues = value.value;
                const expectedTypeFields = expectedType.getProperties();
                return expectedTypeFields.reduce((acc, field, idx) => {
                    const name = field.name.toString();
                    const expectedFieldType = field.type;
                    const tsValue = constructTsValueFromValue(fieldValues[idx], expectedFieldType);
                    if (field.optional && (tsValue === undefined || tsValue === null)) {
                        return acc;
                    }
                    else {
                        acc[name] = tsValue;
                        return acc;
                    }
                }, {});
            }
            else {
                throw new Error(`Expected object, obtained value ${value}`);
            }
        case u.Interface:
            if (value.kind === 'record') {
                const fieldValues = value.value;
                const expectedTypeFields = expectedType.getProperties();
                return expectedTypeFields.reduce((acc, field, idx) => {
                    const name = field.name.toString();
                    const expectedFieldType = field.type;
                    const tsValue = constructTsValueFromValue(fieldValues[idx], expectedFieldType);
                    if (field.optional && (tsValue === undefined || tsValue === null)) {
                        return acc;
                    }
                    else {
                        acc[name] = tsValue;
                        return acc;
                    }
                }, {});
            }
            else {
                throw new Error(`Expected object, obtained value ${value}`);
            }
        case u.Undefined:
            return null;
        case u.Union:
            if (value.kind === 'variant') {
                const caseValue = value.caseValue;
                if (!caseValue) {
                    throw new Error(`Expected value, obtained value ${value}`);
                }
                const unionTypes = expectedType.types;
                const matchingType = unionTypes[value.caseIdx];
                return constructTsValueFromValue(caseValue, matchingType);
            }
            else {
                throw new Error(`Expected union, obtained value ${value}`);
            }
        case u.Alias:
            const aliasType = expectedType;
            const targetType = aliasType.target;
            return constructTsValueFromValue(value, targetType);
        case u.StringLiteral:
            if (value.kind === 'string') {
                return value.value;
            }
            else {
                throw new Error(`Unrecognized value for ${value.kind}`);
            }
        case u.Promise:
            const innerType = expectedType.getTypeArguments()[0];
            return constructTsValueFromValue(value, innerType);
        case u.Type:
            if (expectedType.isArray()) {
                if (value.kind === 'list') {
                    return value.value.map((item) => constructTsValueFromValue(item, expectedType.getTypeArguments?.()[0]));
                }
                else {
                    throw new Error(`Expected array, obtained value ${value}`);
                }
            }
            else if (expectedType.isTuple()) {
                const typeArg = expectedType.getTypeArguments?.();
                if (value.kind === 'tuple') {
                    return value.value.map((item, idx) => constructTsValueFromValue(item, typeArg[idx]));
                }
                else {
                    throw new Error(`Expected tuple, obtained value ${value}`);
                }
            }
            else if (expectedType.isGenericType()) {
                const genericType = expectedType;
                const genericTypeDefinition = genericType.genericTypeDefinition;
                if (genericTypeDefinition.name === 'Map') {
                    const typeArgs = expectedType.getTypeArguments?.();
                    if (!typeArgs || typeArgs.length !== 2) {
                        throw new Error('Map must have two type arguments');
                    }
                    if (value.kind === 'list') {
                        const entries = value.value.map((item) => {
                            if (item.kind !== 'tuple' || item.value.length !== 2) {
                                throw new Error(`Expected tuple of two items, obtained value ${item}`);
                            }
                            return [
                                constructTsValueFromValue(item.value[0], typeArgs[0]),
                                constructTsValueFromValue(item.value[1], typeArgs[1]),
                            ];
                        });
                        return new Map(entries);
                    }
                    else {
                        throw new Error(`Expected Map, obtained value ${value}`);
                    }
                }
                else if (isInBuiltResult(expectedType)) {
                    if (value.kind === 'result') {
                        const resultValue = value.value;
                        const typeArgs = expectedType.getTypeArguments?.();
                        if (!typeArgs || typeArgs.length !== 2) {
                            throw new Error('Result type must have two type arguments');
                        }
                        if (resultValue.ok !== undefined) {
                            const okType = typeArgs[0];
                            const resulValue = resultValue.ok;
                            const tsValue = constructTsValueFromValue(resulValue, okType);
                            return {
                                tag: 'ok',
                                val: tsValue,
                            };
                        }
                        else if (resultValue.err !== undefined) {
                            const errType = typeArgs[1];
                            const resulValue = resultValue.err;
                            const tsValue = constructTsValueFromValue(resulValue, errType);
                            return {
                                tag: 'err',
                                val: tsValue,
                            };
                        }
                        else {
                            throw new Error(`Expected result with ok or err, obtained value ${value}`);
                        }
                    }
                }
                else if (genericTypeDefinition.name === 'Promise') {
                    const typeArgs = expectedType.getTypeArguments?.();
                    if (!typeArgs || typeArgs.length !== 1) {
                        throw new Error('Promise type must have one type argument');
                    }
                    return constructTsValueFromValue(value, typeArgs[0]);
                }
                else {
                    throw new Error(`Generic type ${genericTypeDefinition.name} not supported`);
                }
            }
            else {
                const arg = expectedType.getTypeArguments?.()[0];
                if (!arg) {
                    throw new Error('Type must have a type argument');
                }
                return constructTsValueFromValue(value, arg);
            }
        default:
            throw new Error(`'${expectedType.displayName} with kind ${expectedType.kind} not supported'`);
    }
}

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
function getLocalClient(ctor) {
    return (...args) => {
        const agentClassName = AgentClassNameConstructor.fromString(ctor.name);
        const agentInitiator = getOrThrowWith(AgentInitiatorRegistry.lookup(AgentNameConstructor.fromAgentClassName(agentClassName)), () => {
        });
        const classMetadata = getOrThrowWith(TypeMetadata.lookupClassMetadata(agentClassName), () => {
        });
        const constructor = classMetadata.getConstructors()[0];
        const parameters = constructor.getParameters();
        const parameterWitValuesResult = all(args.map((fnArg, index) => {
            const typ = parameters[index].type;
            return constructWitValueFromTsValue(fnArg, typ);
        }));
        // There is no big advantage of returning a Result here,
        // and gives bad experience to the users:
        // `MyAgent.createLocal` should just give a normal error.
        // If they want to handle errors, they can use `Either` or `Result` or try-catch.
        const parameterWitValues = isLeft(parameterWitValuesResult)
            ? (() => {
                throw new Error('Failed to create a local agent' +
                    JSON.stringify(parameterWitValuesResult.left));
            })()
            : parameterWitValuesResult.right;
        // Currently handling only wit value
        const dataValue = {
            tag: 'tuple',
            val: parameterWitValues.map((param) => {
                return {
                    tag: 'component-model',
                    val: param,
                };
            }),
        };
        // We ensure to create every agent using agentInitiator
        const resolvedAgent = agentInitiator.initiate(agentClassName, dataValue);
        if (resolvedAgent.tag === 'err') {
            throw new Error('Failed to create agent: ' + JSON.stringify(resolvedAgent.val));
        }
        else {
            const instance = resolvedAgent.val.classInstance;
            return new Proxy(instance, {
                get(target, prop) {
                    const val = target[prop];
                    if (typeof val === 'function') {
                        return (...fnArgs) => {
                            return val.apply(target, fnArgs);
                        };
                    }
                    return val;
                },
            });
        }
    };
}
function getRemoteClient(ctor) {
    return (...args) => {
        const instance = new ctor(...args);
        const metadata = Metadata.getTypes().filter((type) => type.isClass() && type.name === ctor.name)[0];
        const agentClassName = AgentClassNameConstructor.fromString(ctor.name);
        getOrThrowWith(AgentRegistry.lookup(agentClassName), () => {
        });
        // getAgentComponent in code_first branch to be implemented
        // until then using self metadata
        const componentId = getSelfMetadata().workerId.componentId;
        const rpc = WasmRpc.ephemeral(componentId);
        const result = rpc.invokeAndAwait('golem:simulated-agentic-typescript/simulated-agent-ts.{weather-agent.new}', []);
        const resourceWitValues = result.tag === 'err'
            ? (() => {
                throw new Error('Failed to create resource: ' +
                    JSON.stringify(result.val) +
                    ' ' +
                    JSON.stringify(componentId) +
                    ' should be the same as ' +
                    JSON.stringify(componentId));
            })()
            : result.val;
        const resourceValue = constructValueFromWitValue(resourceWitValues);
        const resourceVal = (() => {
            switch (resourceValue.kind) {
                case 'tuple':
                    return resourceValue.value[0];
                default:
                    throw new Error('Unsupported kind: ' + resourceValue.kind);
            }
        })();
        const workerId = getWorkerName(resourceVal, componentId);
        const resourceWitValue = constructWitValueFromValue(resourceVal);
        return new Proxy(instance, {
            get(target, prop) {
                const val = target[prop];
                if (typeof val === 'function') {
                    const signature = metadata
                        .getMethod(prop)
                        ?.getSignatures()[0];
                    const paramInfo = signature.getParameters();
                    const returnType = signature.returnType;
                    return (...fnArgs) => {
                        const functionName = `golem:simulated-agentic-typescript/simulated-agent.{[method]{${ctor.name}.{${prop.toString()}}`;
                        const parameterWitValuesResult = all(fnArgs.map((fnArg, index) => {
                            const typ = paramInfo[index].type;
                            return constructWitValueFromTsValue(fnArg, typ);
                        }));
                        // There is no big advantage of returning a Result here,
                        // and gives bad experience to the users:
                        // `MyAgent.createRemote` should just give a normal error.
                        // If they want to handle errors, they can use `Either` or `Result`
                        // or try-catch.
                        const parameterWitValues = isLeft(parameterWitValuesResult)
                            ? (() => {
                                throw new Error('Failed to create remote agent: ' +
                                    JSON.stringify(parameterWitValuesResult.left));
                            })()
                            : parameterWitValuesResult.right;
                        const inputArgs = [
                            resourceWitValue,
                            ...parameterWitValues,
                        ];
                        const invokeRpc = new WasmRpc(workerId);
                        const rpcResult = invokeRpc.invokeAndAwait(functionName, inputArgs);
                        const rpcWitValue = rpcResult.tag === 'err'
                            ? (() => {
                                throw new Error('Failed to invoke function: ' +
                                    JSON.stringify(result.val));
                            })()
                            : result.val;
                        return constructTsValueFromWitValue(rpcWitValue, returnType);
                    };
                }
                return val;
            },
        });
    };
}
function getWorkerName(value, componentId) {
    if (value.kind === 'handle') {
        const parts = value.uri.split('/');
        const workerName = parts[parts.length - 1];
        if (!workerName) {
            throw new Error('Worker name not found in URI');
        }
        return { componentId, workerName };
    }
    throw new Error(`Expected value to be a handle, but got: ${JSON.stringify(value)}`);
}

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
 * Maintains a counter for each agent type to ensure unique IDs for each instance.
 */
const agentInstanceSequence = new Map();
/**
 * Creates a unique `AgentId` for an agent instance based on its name and the current worker's metadata.
 * Creation of a unique ID will increment the sequence number for that agent type.
 * @param agentName
 */
function createUniqueAgentId(agentName) {
    const current = agentInstanceSequence.get(agentName) ?? 0;
    agentInstanceSequence.set(agentName, current + 1);
    const count = agentInstanceSequence.get(agentName);
    const workerName = getSelfMetadata().workerId.workerName;
    return new AgentId(workerName, agentName, count);
}

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
function getNameFromAnalysedType(typ) {
    switch (typ.kind) {
        case 'variant':
            return typ.value.name;
        case 'result':
            return typ.value.name;
        case 'option':
            return typ.value.name;
        case 'enum':
            return typ.value.name;
        case 'flags':
            return typ.value.name;
        case 'record':
            return typ.value.name;
        case 'tuple':
            return typ.value.name;
        case 'list':
            return typ.value.name;
        case 'handle':
            return typ.value.name;
        default:
            return undefined;
    }
}
const analysedType = {
    field: (name, typ) => ({ name, typ }),
    case: (name, typ) => ({ name, typ }),
    optCase: (name, typ) => ({ name, typ }),
    unitCase: (name) => ({ name }),
    bool: () => ({ kind: 'bool' }),
    str: () => ({ kind: 'string' }),
    chr: () => ({ kind: 'chr' }),
    f64: () => ({ kind: 'f64' }),
    f32: () => ({ kind: 'f32' }),
    u64: () => ({ kind: 'u64' }),
    s64: () => ({ kind: 's64' }),
    u32: () => ({ kind: 'u32' }),
    s32: () => ({ kind: 's32' }),
    u16: () => ({ kind: 'u16' }),
    s16: () => ({ kind: 's16' }),
    u8: () => ({ kind: 'u8' }),
    s8: () => ({ kind: 's8' }),
    list: (inner) => ({ kind: 'list', value: { name: undefined, inner } }),
    option: (inner) => ({ kind: 'option', value: { name: undefined, inner } }),
    tuple: (items) => ({ kind: 'tuple', value: { name: undefined, items } }),
    record: (fields) => ({ kind: 'record', value: { name: undefined, fields } }),
    flags: (names) => ({ kind: 'flags', value: { name: undefined, names } }),
    enum: (cases) => ({ kind: 'enum', value: { name: undefined, cases } }),
    variant: (cases) => ({ kind: 'variant', value: { name: undefined, cases } }),
    resultOk: (ok) => ({ kind: 'result', value: { name: undefined, ok } }),
    resultErr: (err) => ({ kind: 'result', value: { name: undefined, err } }),
    result: (ok, err) => ({ kind: 'result', value: { name: undefined, ok, err } }),
    handle: (resourceId, mode) => ({ kind: 'handle', value: { name: undefined, resourceId, mode } }),
};

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
class WitTypeBuilder {
    constructor() {
        this.nodes = [];
        this.mapping = new Map();
    }
    add(typ) {
        const hash = JSON.stringify(typ);
        if (this.mapping.has(hash)) {
            return this.mapping.get(hash);
        }
        const idx = this.nodes.length;
        const boolType = { tag: 'prim-bool-type' };
        this.nodes.push({ name: undefined, type: boolType });
        const node = this.convert(typ);
        const name = getNameFromAnalysedType(typ);
        this.nodes[idx] = { name, type: node };
        this.mapping.set(hash, idx);
        return idx;
    }
    build() {
        return { nodes: this.nodes };
    }
    convert(typ) {
        switch (typ.kind) {
            case 'variant': {
                const cases = typ.value.cases.map((c) => [c.name, c.typ ? this.add(c.typ) : undefined]);
                return { tag: 'variant-type', val: cases };
            }
            case 'result': {
                const ok = typ.value.ok ? this.add(typ.value.ok) : undefined;
                const err = typ.value.err ? this.add(typ.value.err) : undefined;
                return { tag: 'result-type', val: [ok, err] };
            }
            case 'option': {
                const inner = this.add(typ.value.inner);
                return { tag: 'option-type', val: inner };
            }
            case 'enum':
                return { tag: 'enum-type', val: typ.value.cases };
            case 'flags':
                return { tag: 'flags-type', val: typ.value.names };
            case 'record': {
                const fields = typ.value.fields.map((f) => [f.name, this.add(f.typ)]);
                return { tag: 'record-type', val: fields };
            }
            case 'tuple': {
                const elements = typ.value.items.map((item) => this.add(item));
                return { tag: 'tuple-type', val: elements };
            }
            case 'list': {
                const inner = this.add(typ.value.inner);
                return { tag: 'list-type', val: inner };
            }
            case 'string':
                return { tag: 'prim-string-type' };
            case 'chr':
                return { tag: 'prim-char-type' };
            case 'f64':
                return { tag: 'prim-f64-type' };
            case 'f32':
                return { tag: 'prim-f32-type' };
            case 'u64':
                return { tag: 'prim-u64-type' };
            case 's64':
                return { tag: 'prim-s64-type' };
            case 'u32':
                return { tag: 'prim-u32-type' };
            case 's32':
                return { tag: 'prim-s32-type' };
            case 'u16':
                return { tag: 'prim-u16-type' };
            case 's16':
                return { tag: 'prim-s16-type' };
            case 'u8':
                return { tag: 'prim-u8-type' };
            case 's8':
                return { tag: 'prim-s8-type' };
            case 'bool':
                return { tag: 'prim-bool-type' };
            // FIXME: Why? typ.value.resourceId is a number and the handle-type takes a bigint
            case 'handle': {
                const resId = typ.value.resourceId;
                const mode = typ.value.mode === 'owned' ? 'owned' : 'borrowed';
                return { tag: 'handle-type', val: [BigInt(resId), mode] };
            }
            default:
                throw new Error(`Unhandled AnalysedType kind: ${typ.kind}`);
        }
    }
}

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
function numberToOrdinalKebab(n) {
    const units = {
        0: "",
        1: "one",
        2: "two",
        3: "three",
        4: "four",
        5: "five",
        6: "six",
        7: "seven",
        8: "eight",
        9: "nine",
    };
    const teens = {
        10: "ten",
        11: "eleven",
        12: "twelve",
        13: "thirteen",
        14: "fourteen",
        15: "fifteen",
        16: "sixteen",
        17: "seventeen",
        18: "eighteen",
        19: "nineteen",
    };
    const tens = {
        2: "twenty",
        3: "thirty",
        4: "forty",
        5: "fifty",
        6: "sixty",
        7: "seventy",
        8: "eighty",
        9: "ninety",
    };
    const irregularOrdinals = {
        one: "first",
        two: "second",
        three: "third",
        five: "fifth",
        eight: "eighth",
        nine: "ninth",
        twelve: "twelfth",
    };
    function toWords(num) {
        if (num < 10)
            return units[num];
        if (num < 20)
            return teens[num];
        if (num < 100) {
            const ten = Math.floor(num / 10);
            const unit = num % 10;
            return tens[ten] + (unit ? "-" + units[unit] : "");
        }
        if (num < 1000) {
            const hundred = Math.floor(num / 100);
            const remainder = num % 100;
            return units[hundred] + "-hundred" + (remainder ? "-" + toWords(remainder) : "");
        }
        return num.toString();
    }
    const words = toWords(n);
    const parts = words.split("-");
    const lastWord = parts[parts.length - 1];
    let ordinalLastWord;
    if (irregularOrdinals[lastWord]) {
        ordinalLastWord = irregularOrdinals[lastWord];
    }
    else if (lastWord.endsWith("y")) {
        ordinalLastWord = lastWord.slice(0, -1) + "ieth";
    }
    else {
        ordinalLastWord = lastWord + "th";
    }
    parts[parts.length - 1] = ordinalLastWord;
    return parts.join("-").toLowerCase();
}

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
function constructWitTypeFromTsType(type) {
    return flatMap(constructAnalysedTypeFromTsType(type), (analysedType) => {
        const builder = new WitTypeBuilder();
        builder.add(analysedType);
        const result = builder.build();
        return right(result);
    });
}
function constructAnalysedTypeFromTsType(type) {
    switch (type.kind) {
        case u.Boolean:
            return right(analysedType.bool());
        case u.False:
            return right(analysedType.bool());
        case u.True:
            return right(analysedType.bool());
        case u.DataView:
            return right(analysedType.list(analysedType.u8()));
        case u.MapDefinition:
            const mapKeyType = type.getTypeArguments?.()[0];
            const mapValueType = type.getTypeArguments?.()[1];
            const key = constructAnalysedTypeFromTsType(mapKeyType);
            const value = constructAnalysedTypeFromTsType(mapValueType);
            return zipWith(key, value, (k, v) => analysedType.list(analysedType.tuple([k, v])));
        case u.WeakMapDefinition:
            const weakMapKeyType = type.getTypeArguments?.()[0];
            const weakMapValueType = type.getTypeArguments?.()[1];
            const weakKey = constructAnalysedTypeFromTsType(weakMapKeyType);
            const weakValue = constructAnalysedTypeFromTsType(weakMapValueType);
            return zipWith(weakKey, weakValue, (k, v) => analysedType.list(analysedType.tuple([k, v])));
        case u.IteratorDefinition:
            const iteratorType = type.getTypeArguments?.()[0];
            if (!iteratorType) {
                return left("Iterator must have a type argument");
            }
            else {
                return map(constructAnalysedTypeFromTsType(iteratorType), (result) => analysedType.list(result));
            }
        case u.IterableDefinition:
            const iterableType = type.getTypeArguments?.()[0];
            if (!iterableType) {
                return left("Iterable must have a type argument");
            }
            else {
                return map(constructAnalysedTypeFromTsType(iterableType), (result) => analysedType.list(result));
            }
        case u.IterableIteratorDefinition:
            const iterableIteratorType = type.getTypeArguments?.()[0];
            if (!iterableIteratorType) {
                return left("IterableIterator must have a type argument");
            }
            else {
                return map(constructAnalysedTypeFromTsType(iterableIteratorType), (result) => analysedType.list(result));
            }
        case u.Type: {
            const typeArgs = type.getTypeArguments?.() ?? [];
            const requireArgs = (n, msg) => {
                if (typeArgs.length !== n) {
                    return left(`Unable to handle the type ${type.id} ${type.name}. ${msg}`);
                }
                return null;
            };
            const handleSingleArg = (msg) => {
                const err = requireArgs(1, msg);
                if (err)
                    return err;
                return constructAnalysedTypeFromTsType(typeArgs[0]);
            };
            if (type.isArray()) {
                const err = requireArgs(1, "Array must have a type argument");
                if (err)
                    return err;
                return map(constructAnalysedTypeFromTsType(typeArgs[0]), analysedType.list);
            }
            if (type.isTuple()) {
                return map(all(typeArgs.map(constructAnalysedTypeFromTsType)), analysedType.tuple);
            }
            if (type.isGenericType()) {
                const genericType = type;
                const defName = genericType.genericTypeDefinition.name;
                if (defName === "Map") {
                    const err = requireArgs(2, "Map must have two type arguments");
                    if (err)
                        return err;
                    return zipWith(constructAnalysedTypeFromTsType(typeArgs[0]), constructAnalysedTypeFromTsType(typeArgs[1]), (keyType, valueType) => analysedType.list(analysedType.tuple([keyType, valueType])));
                }
                if (isInBuiltResult(type)) {
                    const err = requireArgs(2, "Result type must have concrete type arguments");
                    if (err)
                        return err;
                    return zipWith(constructAnalysedTypeFromTsType(typeArgs[0]), constructAnalysedTypeFromTsType(typeArgs[1]), analysedType.result);
                }
                return handleSingleArg(`The type id is ${genericType.id}.`);
            }
            return handleSingleArg(`The type id is ${type.id}.`);
        }
        case u.Object:
            const object = type;
            const props = object.getProperties();
            if (props.length === 0) {
                return left(`Unsupported type for type ${type}`);
            }
            const objectFields = all(props.map(prop => map(constructAnalysedTypeFromTsType(prop.type), (propType) => analysedType.field(prop.name.toString(), propType))));
            return map(objectFields, (fields) => analysedType.record(fields));
        case u.Interface:
            const objectInterface = type;
            const interfaceFields = all(objectInterface.getProperties().map(prop => {
                const propertyAnalysedType = constructAnalysedTypeFromTsType(prop.type);
                if (prop.optional) {
                    return map(propertyAnalysedType, (result) => analysedType.field(prop.name.toString(), analysedType.option(result)));
                }
                else {
                    return map(propertyAnalysedType, (result) => analysedType.field(prop.name.toString(), result));
                }
            }));
            return map(interfaceFields, (fields) => analysedType.record(fields));
        case u.Union:
            let fieldIdx = 1;
            const unionType = type;
            let foundBool = false;
            const possibleTypes = [];
            for (const t of unionType.types) {
                // To work around RTTIST bug where boolean fields in a union are split into true/false
                const isBoolLike = t.kind === u.Boolean ||
                    t.kind === u.True ||
                    t.kind === u.False;
                if (isBoolLike) {
                    if (foundBool)
                        continue;
                    foundBool = true;
                }
                map(constructAnalysedTypeFromTsType(t), (result) => {
                    possibleTypes.push({
                        name: `type-${numberToOrdinalKebab(fieldIdx++)}`,
                        typ: result,
                    });
                });
            }
            return right(analysedType.variant(possibleTypes));
        case u.Alias:
            const typeAlias = type;
            return constructAnalysedTypeFromTsType(typeAlias.target);
        case u.Null:
            return right(analysedType.tuple([]));
        case u.BigInt:
            return right(analysedType.u64());
        case u.Float64Array:
            return right(analysedType.f64());
        case u.Number:
            return right(analysedType.s32()); // For the same reason - as an example - Rust defaults to i32
        case u.String:
            return right(analysedType.str());
        case u.RegExp:
            return right(analysedType.str());
        case u.Error:
            return right(analysedType.resultErr(analysedType.str()));
        case u.Int8Array:
            return right(analysedType.list(analysedType.s8()));
        case u.Uint8Array:
            return right(analysedType.list(analysedType.u8()));
        case u.Uint8ClampedArray:
            return right(analysedType.list(analysedType.u8()));
        case u.ArrayBuffer:
            return right(analysedType.list(analysedType.u8()));
        case u.SharedArrayBuffer:
            return right(analysedType.list(analysedType.u8()));
        case u.Int16Array:
            return right(analysedType.list(analysedType.s16()));
        case u.Uint16Array:
            return right(analysedType.list(analysedType.u16()));
        case u.Int32Array:
            return right(analysedType.list(analysedType.s32()));
        case u.Uint32Array:
            return right(analysedType.list(analysedType.u32()));
        case u.Float32Array:
            return right(analysedType.list(analysedType.f32()));
        case u.BigInt64Array:
            return right(analysedType.list(analysedType.s64()));
        case u.BigUint64Array:
            return right(analysedType.list(analysedType.u64()));
        case u.NumberLiteral:
            return right(analysedType.f64());
        case u.BigIntLiteral:
            return right(analysedType.s64());
        case u.StringLiteral:
            return right(analysedType.str());
        case u.Promise:
            const promiseType = type.getTypeArguments?.()[0];
            if (!promiseType) {
                return left("Promise must have a type argument");
            }
            return constructAnalysedTypeFromTsType(promiseType);
        case u.PromiseDefinition:
            const promiseDefType = type.getTypeArguments?.()[0];
            if (!promiseDefType) {
                return left("PromiseDefinition must have a type argument");
            }
            return map(constructAnalysedTypeFromTsType(promiseDefType), analysedType.option);
        case u.ObjectType:
            const obj = type;
            const fields = all(obj.getProperties().map(prop => {
                return map(constructAnalysedTypeFromTsType(prop.type), (result) => analysedType.field(prop.name.toString(), result));
            }));
            return map(fields, analysedType.record);
        case u.TupleDefinition:
            const tupleTypes = all(type.getTypeArguments?.().map(constructAnalysedTypeFromTsType)) || all([]);
            return map(tupleTypes, analysedType.tuple);
        case u.ArrayDefinition:
            const arrayType = type.getTypeArguments?.()[0];
            if (!arrayType) {
                return left("Array must have a type argument");
            }
            return map(constructAnalysedTypeFromTsType(arrayType), analysedType.list);
        case u.ReadonlyArrayDefinition:
            const elementType = type.getTypeArguments?.()[0];
            if (!elementType) {
                return left("Array must have a type argument");
            }
            return map(constructAnalysedTypeFromTsType(elementType), analysedType.list);
        default:
            return left(`The following type is not supported as argument or return type in agentic context ${type.displayName}`);
    }
}

const methodMetadata = new Map();
const MethodMetadata = {
    ensureMeta(agentClassName, method) {
        if (!methodMetadata.has(agentClassName)) {
            methodMetadata.set(agentClassName, new Map());
        }
        const classMeta = methodMetadata.get(agentClassName);
        if (!classMeta.has(method)) {
            classMeta.set(method, {});
        }
    },
    lookup(agentClassName) {
        return methodMetadata.get(agentClassName);
    },
    setPromptName(agentClassName, method, prompt) {
        MethodMetadata.ensureMeta(agentClassName, method);
        const classMeta = methodMetadata.get(agentClassName);
        classMeta.get(method).prompt = prompt;
    },
    setDescription(agentClassName, method, description) {
        MethodMetadata.ensureMeta(agentClassName, method);
        const classMeta = methodMetadata.get(agentClassName);
        classMeta.get(method).description = description;
    },
};

function getConstructorDataSchema(classType) {
    const constructorInfos = classType.getConstructors();
    if (constructorInfos.length > 1) {
        throw new Error(`Agent type ${classType.name} has multiple constructors. Please specify the constructor parameters explicitly.`);
    }
    const constructorSignatureInfo = constructorInfos[0];
    const constructorParamInfos = constructorSignatureInfo.getParameters();
    const constructorParamTypes = all(constructorParamInfos.map((paramInfo) => constructWitTypeFromTsType(paramInfo.type)));
    const constructDataSchemaResult = map(constructorParamTypes, (paramType) => {
        return paramType.map((paramType, idx) => {
            const paramName = constructorParamInfos[idx].name;
            return [
                paramName,
                {
                    tag: 'component-model',
                    val: paramType,
                },
            ];
        });
    });
    return map(constructDataSchemaResult, (nameAndElementSchema) => {
        return {
            tag: 'tuple',
            val: nameAndElementSchema,
        };
    });
}
function getAgentMethodSchema(classType, agentClassName) {
    let filteredType = classType;
    let methodNames = filteredType.getMethods();
    return all(methodNames.map((methodInfo) => {
        const signature = methodInfo.getSignatures()[0];
        const parameters = signature.getParameters();
        const returnType = signature.returnType;
        const methodName = methodInfo.name.toString();
        const baseMeta = MethodMetadata.lookup(agentClassName)?.get(methodName) ?? {};
        const inputSchemaEither = buildInputSchema(parameters);
        if (isLeft(inputSchemaEither)) {
            return left(`Failed to construct input schema for method ${methodName}: ${inputSchemaEither.left}`);
        }
        const inputSchema = inputSchemaEither.right;
        const outputSchemaEither = buildOutputSchema(returnType);
        if (isLeft(outputSchemaEither)) {
            return left(`Failed to construct output schema for method ${methodName}: ${outputSchemaEither.left}`);
        }
        const outputSchema = outputSchemaEither.right;
        return right({
            name: methodName,
            description: baseMeta.description ?? '',
            promptHint: baseMeta.prompt ?? '',
            inputSchema: inputSchema,
            outputSchema: outputSchema,
        });
    }));
}
function buildInputSchema(paramTypes) {
    const result = all(paramTypes.map((parameterInfo) => map(convertToElementSchema(parameterInfo.type), (result) => {
        return [parameterInfo.name, result];
    })));
    return map(result, (res) => {
        return {
            tag: 'tuple',
            val: res,
        };
    });
}
function buildOutputSchema(returnType) {
    return map(convertToElementSchema(returnType), (result) => {
        return {
            tag: 'tuple',
            val: [['return-value', result]],
        };
    });
}
function convertToElementSchema(type) {
    return map(constructWitTypeFromTsType(type), (witType) => {
        return {
            tag: 'component-model',
            val: witType,
        };
    });
}

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
 * Marks a class as an Agent and registers it in the global agent registry.
 * Note that the method generates a `local` and `remote` client for the agent.
 * The details of these clients are explained further below.
 *
 * The `@agent()` decorator:
 * - Registers the agent type for discovery by other agents.
 * - Inspects the constructor to determine its parameter types.
 * - Inspects all methods to determine their input/output parameter types.
 * - Associates metadata such as `prompt` and `description` with the agent.
 * - Creates `.createLocal()` and `.createRemote()` factory methods on the class.
 * - Enables schema-based validation of parameters and return values.
 *
 * ### Naming
 * By default, the agent name is the kebab-case of the class name.
 * Example:
 * ```ts
 * @agent()
 * class WeatherAgent {} // -> "weather-agent"
 * ```
 * You can override the name using explicit metadata.
 *
 * ### Metadata
 * Prompt and description are **recommended** so that other agents can decide whether to interact with this agent.
 * ```ts
 * @prompt("Provide a city name")
 * @description("Get the current weather for a location")
 * getWeather(city: string): Promise<WeatherResult> { ... }
 * ```
 *
 * ### Agent parameter types
 *
 * Please note that there are a few limitations in what can be types of these parameters.
 * Please read through the documentation that list the types that are currently supported.
 *
 * - Constructor and method parameters can be any valid TypeScript type.
 * - **Enums are not supported**.
 * - Use **type aliases** for clarity and reusability.
 * ```ts
 * type Coordinates = { lat: number; lon: number };
 * type WeatherReport = { temperature: number; description: string };
 *
 * @agent()
 * class WeatherAgent {
 *   constructor(apiKey: string) {}
 *
 *   getWeather(coords: Coordinates): WeatherReport { ... }
 * }
 * ```
 *
 * ### Example
 *
 * ```ts
 * @agent()
 * class CalculatorAgent {
 *   constructor(baseValue: number) {}
 *
 *   add(value: number): number {
 *     return this.baseValue + value;
 *   }
 * }
 *
 * ### Remote and Local Clients
 *
 * A local client is a direct instance of the agent class,
 * which can be used to call methods directly. It is recommended to use the local clients
 * even if you can create a local client by directly calling the constructor.
 *
 * With a local client, any logic defined in the agent class is executed in the same container.
 *
 * const calc = CalculatorAgent.createLocal(10);
 * console.log(calc.add(5)); // 15
 *
 * The purpose of a remote client is that it allows you to invoke the agent constructor
 * and methods of an agent (even if it's defined with in the same code) in a different container.
 * An immediate outcome of this is that you are offloading the work of this agent to a different container
 * than the current container.
 *
 * const calcRemote = CalculatorAgent.createRemote();
 * calcRemote.add(5);
 * ```
 */
function agent() {
    return function (ctor) {
        const agentClassName = AgentClassNameConstructor.fromString(ctor.name);
        if (AgentRegistry.exists(agentClassName)) {
            return ctor;
        }
        let classType = getOrElse$1(TypeMetadata.lookupClassMetadata(agentClassName), () => {
            throw new Error(`Agent class ${agentClassName} is not registered in TypeMetadata. Please ensure the class is decorated with @agent()`);
        });
        const constructorDataSchema = getOrElse(getConstructorDataSchema(classType), (err) => {
            throw new Error('Invalid constructor parameters for the agent: ' + err);
        });
        let filteredType = classType;
        const methodSchemaEither = getAgentMethodSchema(filteredType, agentClassName);
        // Note: Either.getOrThrowWith doesn't seem to work within the decorator context
        if (isLeft(methodSchemaEither)) {
            throw new Error(`Failed to get agent method schema for ${agentClassName}: ${methodSchemaEither.left}`);
        }
        const methods = methodSchemaEither.right;
        const agentName = AgentNameConstructor.fromAgentClassName(agentClassName);
        const agentType = {
            typeName: agentName,
            description: agentClassName,
            constructor: {
                name: agentClassName,
                description: `Constructs ${agentClassName}`,
                promptHint: 'Enter something...',
                inputSchema: constructorDataSchema,
            },
            methods,
            dependencies: [],
        };
        AgentRegistry.register(agentClassName, agentType);
        ctor.createRemote = getRemoteClient(ctor);
        ctor.createLocal = getLocalClient(ctor);
        AgentInitiatorRegistry.register(AgentNameConstructor.fromAgentClassName(agentClassName), {
            initiate: (_agentName, constructorParams) => {
                const constructorInfo = classType.getConstructors()[0];
                const constructorParamTypes = constructorInfo.getParameters();
                const constructorParamWitValues = getWitValueFromDataValue(constructorParams);
                const convertedConstructorArgs = constructorParamWitValues.map((witVal, idx) => {
                    return constructTsValueFromWitValue(witVal, constructorParamTypes[idx].type);
                });
                const instance = new ctor(...convertedConstructorArgs);
                const uniqueAgentId = createUniqueAgentId(agentName);
                instance.getId = () => uniqueAgentId;
                const agentInternal = {
                    getId: () => {
                        return uniqueAgentId;
                    },
                    getAgentType: () => {
                        return getOrThrowWith(AgentRegistry.lookup(agentClassName), () => new Error(`Failed to find agent type for ${agentClassName}`));
                    },
                    invoke: async (method, args) => {
                        const fn = instance[method];
                        if (!fn)
                            throw new Error(`Method ${method} not found on agent ${agentClassName}`);
                        const agentTypeOpt = AgentRegistry.lookup(agentClassName);
                        if (isNone(agentTypeOpt)) {
                            const error = {
                                tag: 'invalid-method',
                                val: `Agent type ${agentClassName} not found in registry.`,
                            };
                            return {
                                tag: 'err',
                                val: error,
                            };
                        }
                        const agentType = agentTypeOpt.value;
                        const methodInfo = classType.getMethod(method);
                        const methodSignature = methodInfo.getSignatures()[0];
                        const paramTypes = methodSignature.getParameters();
                        const argsWitValues = getWitValueFromDataValue(args);
                        const returnType = methodSignature.returnType;
                        const convertedArgs = argsWitValues.map((witVal, idx) => {
                            return constructTsValueFromWitValue(witVal, paramTypes[idx].type);
                        });
                        const result = await fn.apply(instance, convertedArgs);
                        const methodDef = agentType.methods.find((m) => m.name === method);
                        if (!methodDef) {
                            const entriesAsStrings = Array.from(AgentRegistry.entries()).map(([key, value]) => `Key: ${key}, Value: ${JSON.stringify(value, null, 2)}`);
                            const error = {
                                tag: 'invalid-method',
                                val: `Method ${method} not found in agent type ${agentClassName}. Available methods: ${entriesAsStrings.join(', ')}`,
                            };
                            return {
                                tag: 'err',
                                val: error,
                            };
                        }
                        const returnValue = constructWitValueFromTsValue(result, returnType);
                        if (isLeft(returnValue)) {
                            const agentError = {
                                tag: 'invalid-method',
                                val: `Invalid return value from ${method}: ${getLeft(returnValue)}`,
                            };
                            return {
                                tag: 'err',
                                val: agentError,
                            };
                        }
                        return {
                            tag: 'ok',
                            val: getDataValueFromWitValueReturned(returnValue.right),
                        };
                    },
                };
                return {
                    tag: 'ok',
                    val: new ResolvedAgent(agentClassName, agentInternal, instance),
                };
            },
        });
    };
}
function prompt(prompt) {
    return function (target, propertyKey) {
        const agentClassName = AgentClassNameConstructor.fromString(target.constructor.name);
        MethodMetadata.setPromptName(agentClassName, propertyKey, prompt);
    };
}
function description(desc) {
    return function (target, propertyKey) {
        const agentClassName = AgentClassNameConstructor.fromString(target.constructor.name);
        MethodMetadata.setDescription(agentClassName, propertyKey, desc);
    };
}
// FIXME: in the next verison, handle all dataValues
function getWitValueFromDataValue(dataValue) {
    if (dataValue.tag === 'tuple') {
        return dataValue.val.map((elem) => {
            if (elem.tag === 'component-model') {
                return elem.val;
            }
            else {
                throw new Error(`Unsupported element type: ${elem.tag}`);
            }
        });
    }
    else {
        throw new Error(`Unsupported DataValue type: ${dataValue.tag}`);
    }
}
// Why is return value a tuple with a single element?
// why should it have a name?
function getDataValueFromWitValueReturned(witValues) {
    return {
        tag: 'tuple',
        val: [
            {
                tag: 'component-model',
                val: witValues,
            },
        ],
    };
}

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
/// Registry
const agents = new Map();
const UninitiatedAgentErrorMessage = 'Agent is not initialized. Please create an agent first using static function called create';
const UninitializedAgentError = {
    tag: 'custom-error',
    val: {
        tag: 'tuple',
        val: [
            {
                tag: 'component-model',
                val: constructWitValueFromValue({
                    kind: 'string',
                    value: UninitiatedAgentErrorMessage,
                }),
            },
        ],
    },
};
// An error can happen if the user agent is not composed (which will initialize the agent with precompiled wasm)
function getResolvedAgentOrThrow(resolvedAgent, agentName) {
    return getOrThrowWith(resolvedAgent, () => new Error(UninitiatedAgentErrorMessage));
}
// Component export
class Agent {
    constructor() {
        this.resolvedAgent = none();
    }
    async getId() {
        return getResolvedAgentOrThrow(this.resolvedAgent)
            .getId()
            .toString();
    }
    async invoke(methodName, input) {
        if (isNone(this.resolvedAgent)) {
            return {
                tag: 'err',
                val: UninitializedAgentError,
            };
        }
        return this.resolvedAgent.value.invoke(methodName, input);
    }
    async getDefinition() {
        return getResolvedAgentOrThrow(this.resolvedAgent).getDefinition();
    }
    static async create(agentType, input) {
        const initiator = AgentInitiatorRegistry.lookup(AgentNameConstructor.fromString(agentType));
        if (isNone(initiator)) {
            const entries = Array.from(AgentInitiatorRegistry.entries()).map((entry) => entry[0]);
            return {
                tag: 'err',
                val: createCustomError(`No implementation found for agent: ${agentType}. Valid entries are ${entries.join(', ')}`),
            };
        }
        const initiateResult = initiator.value.initiate(agentType, input);
        if (initiateResult.tag === 'ok') {
            const agent = new Agent();
            agent.resolvedAgent = some(initiateResult.val);
            agents.set(initiateResult.val.getId(), agent);
            return {
                tag: 'ok',
                val: agent,
            };
        }
        else {
            return {
                tag: 'err',
                val: initiateResult.val,
            };
        }
    }
}
async function getAgent(agentType, agentId) {
    const typedAgentId = AgentId.fromString(agentId);
    if (typedAgentId.agentName.toString() !== agentType) {
        throw new Error(`Agent ID ${agentId} does not match the expected type ${agentType}`);
    }
    const agent = agents.get(typedAgentId);
    if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
    }
    return agent;
}
async function discoverAgents() {
    return Array.from(agents.values());
}
async function discoverAgentTypes() {
    return AgentRegistry.getRegisteredAgents();
}
const guest = {
    getAgent,
    discoverAgents,
    discoverAgentTypes,
    Agent,
};

export { AgentId, BaseAgent, Metadata, agent, agents, description, guest, prompt };
//# sourceMappingURL=index.mjs.map
