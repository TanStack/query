/**
 * A value that can be passed directly or read from a zero-argument getter.
 *
 * Lit Query APIs read function accessors during host updates, so the getter can
 * depend on reactive host state.
 *
 * @example
 * ```ts
 * const staticKey: Accessor<readonly unknown[]> = ['todos']
 * const reactiveKey: Accessor<readonly unknown[]> = () => ['todos', this.userId]
 * ```
 */
export type Accessor<T> = T | (() => T)

export function readAccessor<T>(value: Accessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

/**
 * A callable accessor with a `current` property for reading the latest
 * controller result.
 *
 * Controller creators and cache state helpers return this shape so render code
 * can use either `result()` or `result.current`.
 *
 * @example
 * ```ts
 * const query = this.todos()
 * const sameQuery = this.todos.current
 * ```
 */
export type ValueAccessor<T> = (() => T) & {
  readonly current: T
}

export function createValueAccessor<T>(getter: () => T): ValueAccessor<T> {
  const accessor = (() => getter()) as ValueAccessor<T>
  Object.defineProperty(accessor, 'current', {
    get: getter,
    enumerable: true,
  })
  return accessor
}
