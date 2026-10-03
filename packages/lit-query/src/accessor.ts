/**
 * A value that can be passed directly or read from a zero-argument getter.
 *
 * Lit Query APIs read function accessors during host updates, so the getter can
 * depend on reactive host state.
 * @example
 * ```ts
 * const staticKey: Accessor<readonly unknown[]> = ['todos']
 * const reactiveKey: Accessor<readonly unknown[]> = () => ['todos', this.userId]
 * ```
 */
export type Accessor<T> = T | (() => T)

/**
 * Reads an {@link Accessor}: calls it if it is a function, otherwise returns it as is.
 * @param value - The value, or a getter that returns it.
 * @returns The value.
 */
export function readAccessor<T>(value: Accessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

/**
 * A callable accessor with a `current` property for reading the latest
 * controller result.
 *
 * Controller creators and cache state helpers return this shape so render code
 * can use either `result()` or `result.current`.
 * @example
 * ```ts
 * const query = this.todos()
 * const sameQuery = this.todos.current
 * ```
 */
export type ValueAccessor<T> = (() => T) & {
  readonly current: T
}

/**
 * Creates a {@link ValueAccessor} that reads its value from `getter`, both when called and through
 * its `current` property.
 * @param getter - Returns the latest value.
 * @returns The value accessor.
 */
export function createValueAccessor<T>(getter: () => T): ValueAccessor<T> {
  const accessor = (() => getter()) as ValueAccessor<T>
  Object.defineProperty(accessor, 'current', {
    get: getter,
    enumerable: true,
  })
  return accessor
}
