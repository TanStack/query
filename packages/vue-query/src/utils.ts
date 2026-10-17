import { isRef, unref } from 'vue-demi'
import type { MaybeRefDeep } from './types'

/**
 * Base Vue injection key `VueQueryPlugin` provides the `QueryClient` under.
 * @internal
 */
export const VUE_QUERY_CLIENT = 'VUE_QUERY_CLIENT'

/**
 * Builds the injection key `useQueryClient`/`VueQueryPlugin` use for a given `queryClientKey`.
 * @internal
 * @param key - The `queryClientKey`. Without it, the base key is used.
 * @returns The injection key.
 */
export function getClientKey(key?: string) {
  const suffix = key ? `:${key}` : ''
  return `${VUE_QUERY_CLIENT}${suffix}`
}

/**
 * Copies each property from `update` onto `state`, in place, for every key already on `state`.
 * @internal
 * @param state - The object to update.
 * @param update - The object to copy the values from.
 */
export function updateState(
  state: Record<string, any>,
  update: Record<string, any>,
): void {
  Object.keys(state).forEach((key) => {
    state[key] = update[key]
  })
}

/**
 * Recursive implementation of {@link cloneDeep}, which also tracks the key and nesting level of
 * the current node for `customize`.
 * @param value - The value to clone.
 * @param customize - Called for every node with its key and nesting level. If it returns a value
 * other than `undefined`, that value is used instead of recursing.
 * @param currentKey - The key of the current node.
 * @param currentLevel - The nesting level of the current node.
 * @returns The cloned value.
 */
function _cloneDeep<T>(
  value: MaybeRefDeep<T>,
  customize?: (
    val: MaybeRefDeep<T>,
    key: string,
    level: number,
  ) => T | undefined,
  currentKey: string = '',
  currentLevel: number = 0,
): T {
  if (customize) {
    const result = customize(value, currentKey, currentLevel)
    if (result === undefined && isRef(value)) {
      return result as T
    }
    if (result !== undefined) {
      return result
    }
  }

  if (Array.isArray(value)) {
    return value.map((val, index) =>
      _cloneDeep(val, customize, String(index), currentLevel + 1),
    ) as unknown as T
  }

  if (typeof value === 'object' && isPlainObject(value)) {
    const entries = Object.entries(value).map(([key, val]) => [
      key,
      _cloneDeep(val, customize, key, currentLevel + 1),
    ])
    return Object.fromEntries(entries)
  }

  return value as T
}

/**
 * Deep-clones `value`, recursing into arrays and plain objects. `customize`, if provided, can
 * intercept any node (by key and nesting level) and substitute its own return value instead of recursing
 * further.
 * @internal
 * @param value - The value to clone.
 * @param customize - Called for every node with its key and nesting level. If it returns a value
 * other than `undefined`, that value is used instead of recursing.
 * @returns The cloned value.
 */
export function cloneDeep<T>(
  value: MaybeRefDeep<T>,
  customize?: (
    val: MaybeRefDeep<T>,
    key: string,
    level: number,
  ) => T | undefined,
): T {
  return _cloneDeep(value, customize)
}

/**
 * Deep-clones `value` like {@link cloneDeep}, additionally unwrapping any `ref`s it encounters (and,
 * if `unrefGetters` is `true`, calling any functions it encounters and unwrapping their result too). Always
 * resolves `queryKey` this way, regardless of `unrefGetters` — this is what lets a `queryKey` containing `ref`s
 * be passed straight through to `@tanstack/query-core`.
 * @internal
 * @param obj - The value to clone.
 * @param unrefGetters - Whether to also call functions and unwrap their result.
 * @returns The cloned value, with `ref`s unwrapped.
 */
export function cloneDeepUnref<T>(
  obj: MaybeRefDeep<T>,
  unrefGetters = false,
): T {
  return cloneDeep(obj, (val, key, level) => {
    // Check if we're at the top level and the key is 'queryKey'
    //
    // If so, take the recursive descent where we resolve
    // getters to values as well as refs.
    if (level === 1 && key === 'queryKey') {
      return cloneDeepUnref(val, true)
    }

    // Resolve getters to values if specified.
    if (unrefGetters && isFunction(val)) {
      // Cast due to older TS versions not allowing calling
      // on certain intersection types.
      return cloneDeepUnref((val as Function)(), unrefGetters)
    }

    // Unref refs and continue to recurse into the value.
    if (isRef(val)) {
      return cloneDeepUnref(unref(val), unrefGetters)
    }

    return undefined
  })
}

/**
 * Checks whether a value is a plain object, created with an object literal or
 * `Object.create(null)`.
 * @param value - The value to check.
 * @returns `true` if `value` is a plain object.
 */
// oxlint-disable-next-line typescript/no-wrapper-object-types
function isPlainObject(value: unknown): value is Object {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

/**
 * Checks whether a value is a function.
 * @param value - The value to check.
 * @returns `true` if `value` is a function.
 */
function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

/**
 * Resolves `source` to a plain value — calls it if it's a function, otherwise deep-unwraps it.
 * @internal
 * @param source - A getter, or a value that may contain `ref`s.
 * @returns The resolved plain value.
 */
export function toValueDeep<T>(source: (() => T) | MaybeRefDeep<T>): T {
  return isFunction(source) ? source() : cloneDeepUnref(source)
}
