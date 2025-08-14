// A few new types that can be used instead of data types such as Effect.Either

/**
 * A simple Either type that can be used to represent success or failure.
 * If you are familiar with effect's `Either`, this is exactly the same usage including the import styles.
 *
 * `Either` can be method parameters or result types for your agent as given below. It will
 * take different representation in agent schema definitions, compared to a simple union type.
 *
 * This SDK exposes `Either` as interim, as we currently don't support direct use of effect's `Either`,
 * and given it's quite commonly used these days.
 *
 *
 * ```ts
 *   import { Either } from '@golemcloud/golem-ts-sdk'
 *
 *   const foo: Either.Either<number, string> = Either.ok(1)
 *   console.log(foo)
 *
 *   @agent()
 *   class MyAgent extends BaseAgent {
 *     async function process(): Promise<Either<number, string>> {
 *         return Either.ok(1);
 *     }
 *   }
 * ```
 *
 * SDK developer note: `namespace` cannot be used in the SDK, as it is not supported by RTTIST.
 * Hence, functionalities such as `map`, `mapBoth` are not under the namespace `Result` as in Effect.Either.
 */
export type Either<T, E> = { tag: 'ok'; val: T } | { tag: 'err'; val: E };

/**
 * Creates a Result with a successful value.
 * @param val
 */
export function ok<T, E = never>(val: T): Either<T, E> {
  return { tag: 'ok', val };
}

/**
 * Creates a Result with an error value.
 * @param val
 */
export function err<T = never, E = unknown>(val: E): Either<T, E> {
  return { tag: 'err', val };
}

/**
 * Maps a Result's value using the provided function if it is an 'ok' Result.
 * If the Result is an 'err', it returns the Result unchanged.
 * @param r The Result to map.
 * @param f The function to apply to the value if it is 'ok'.
 */
export function map<T, E, U>(r: Either<T, E>, f: (t: T) => U): Either<U, E> {
  return r.tag === 'ok' ? ok(f(r.val)) : r;
}

/**
 * Maps both the 'ok' and 'err' values of a Result using the provided functions.
 * If the Result is 'ok', it applies onOk to the value; if 'err', it applies onErr to the error.
 * @param r The Result to map.
 * @param onOk The function to apply to the value if it is 'ok'.
 * @param onErr The function to apply to the error if it is 'err'.
 */
export function mapBoth<T, E, U, F>(
  r: Either<T, E>,
  onOk: (t: T) => U,
  onErr: (e: E) => F,
): Either<U, F> {
  return r.tag === 'ok' ? ok(onOk(r.val)) : err(onErr(r.val));
}

/**
 * Combines two Results into one Result containing a tuple of their values.
 * If either Result is 'err', it returns that error.
 * @param ra The first Result.
 * @param rb The second Result.
 */
export function zipBoth<A, B, E>(
  ra: Either<A, E>,
  rb: Either<B, E>,
): Either<[A, B], E> {
  if (ra.tag === 'err') {
    return { tag: 'err', val: ra.val } as Either<[A, B], E>;
  }
  if (rb.tag === 'err') {
    return { tag: 'err', val: rb.val } as Either<[A, B], E>;
  }
  return ok([ra.val, rb.val]);
}

/**
 * Combines an array of Results into a single Result containing an array of values.
 * If any Result is 'err', it returns that error.
 * @param results An array of Results to combine.
 */
export function allResults<T, E>(results: Either<T, E>[]): Either<T[], E> {
  const vals: T[] = [];
  for (const r of results) {
    if (r.tag === 'err') return r;
    vals.push(r.val);
  }
  return ok(vals);
}
