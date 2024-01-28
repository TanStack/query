import { isRef, unref } from 'vue-demi'
import type { MaybeRefDeep } from './types'

export const VUE_QUERY_CLIENT = 'VUE_QUERY_CLIENT'

export function getClientKey(key?: string) {
  const suffix = key ? `:${key}` : ''
  return `${VUE_QUERY_CLIENT}${suffix}`
}

export function updateState(
  state: Record<string, unknown>,
  update: Record<string, any>,
): void {
  Object.keys(state).forEach((key) => {
    state[key] = update[key]
  })
}

export function cloneDeep<T>(
  value: MaybeRefDeep<T>,
  customize?: (val: MaybeRefDeep<T>) => T | undefined,
): T {
  if (customize) {
    const result = customize(value)
    // If it's a ref of undefined, return undefined
    if (result === undefined && isRef(value)) {
      return result as T
    }
    if (result !== undefined) {
      return result
    }
  }

  if (Array.isArray(value)) {
    return value.map((val) => cloneDeep(val, customize)) as unknown as T
  }

  if (typeof value === 'object' && isPlainObject(value)) {
    const entries = Object.entries(value).map(([key, val]) => [
      key,
      cloneDeep(val, customize),
    ])
    return Object.fromEntries(entries)
  }

  return value as T
}

export function cloneDeepUnref<T>(obj: MaybeRefDeep<T>): T {
  return cloneDeep(obj, (val) => {
    if (isRef(val)) {
      return cloneDeepUnref(unref(val))
    }

    return undefined
  })
}

function isPlainObject(value: unknown): value is Object {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

export function shouldThrowError<T extends (...args: Array<any>) => boolean>(
  throwOnError: boolean | T | undefined,
  params: Parameters<T>,
): boolean {
  // Allow throwOnError function to override throwing behavior on a per-error basis
  if (typeof throwOnError === 'function') {
    return throwOnError(...params)
  }

  return !!throwOnError
}
