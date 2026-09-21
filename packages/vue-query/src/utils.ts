import { isRef, unref } from 'vue-demi'
import type { MaybeRefDeep } from './types'

/** @internal Base Vue injection key `VueQueryPlugin` provides the `QueryClient` under. */
export const VUE_QUERY_CLIENT = 'VUE_QUERY_CLIENT'

/** @internal Builds the injection key `useQueryClient`/`VueQueryPlugin` use for a given `queryClientKey`. */
export function getClientKey(key?: string) {
  const suffix = key ? `:${key}` : ''
  return `${VUE_QUERY_CLIENT}${suffix}`
}

/** @internal Copies each property from `update` onto `state`, in place, for every key already on `state`. */
export function updateState(
  state: Record<string, any>,
  update: Record<string, any>,
): void {
  Object.keys(state).forEach((key) => {
    state[key] = update[key]
  })
}

// Helper function for cloning deep objects where
// the level and key is provided to the callback function.
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
 * @internal Deep-clones `value`, recursing into arrays and plain objects. `customize`, if provided, can
 * intercept any node (by key and nesting level) and substitute its own return value instead of recursing
 * further.
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
 * @internal Deep-clones `value` like {@link cloneDeep}, additionally unwrapping any `ref`s it encounters (and,
 * if `unrefGetters` is `true`, calling any functions it encounters and unwrapping their result too). Always
 * resolves `queryKey` this way, regardless of `unrefGetters` — this is what lets a `queryKey` containing `ref`s
 * be passed straight through to `@tanstack/query-core`.
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

// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
function isPlainObject(value: unknown): value is Object {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

/** @internal Resolves `source` to a plain value — calls it if it's a function, otherwise deep-unwraps it. */
export function toValueDeep<T>(source: (() => T) | MaybeRefDeep<T>): T {
  return isFunction(source) ? source() : cloneDeepUnref(source)
}
