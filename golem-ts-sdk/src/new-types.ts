export type Result<T, E> = { tag: 'ok'; val: T } | { tag: 'err'; val: E };
