import { QueryConfig, QueryStatus, QueryKey, QueryFunction } from './types'

// TYPES

export type DataUpdateFunction<TInput, TOutput> = (input: TInput) => TOutput

export type Updater<TInput, TOutput> =
  | TOutput
  | DataUpdateFunction<TInput, TOutput>

type ConsoleFunction = (...args: any[]) => void

export interface ConsoleObject {
  log: ConsoleFunction
  warn: ConsoleFunction
  error: ConsoleFunction
}

interface Cancelable {
  cancel(): void
}

export class CancelledError {
  silent?: boolean
  constructor(silent?: boolean) {
    this.silent = silent
  }
}

// UTILS

let _uid = 0
export function uid(): number {
  return _uid++
}

export const isServer = typeof window === 'undefined'

export function noop(): undefined {
  return undefined
}

export let Console: ConsoleObject = console || {
  error: noop,
  warn: noop,
  log: noop,
}

export function setConsole(c: ConsoleObject) {
  Console = c
}

export function functionalUpdate<TInput, TOutput>(
  updater: Updater<TInput, TOutput>,
  input: TInput
): TOutput {
  return typeof updater === 'function'
    ? (updater as DataUpdateFunction<TInput, TOutput>)(input)
    : updater
}

function stableStringifyReplacer(_key: string, value: any): unknown {
  if (typeof value === 'function') {
    throw new Error()
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = value[key]
        return result
      }, {} as any)
  }

  return value
}

export function stableStringify(value: any): string {
  return JSON.stringify(value, stableStringifyReplacer)
}

export function deepIncludes(a: any, b: any): boolean {
  if (a === b) {
    return true
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (typeof a === 'object') {
    return !Object.keys(b).some(key => !deepIncludes(a[key], b[key]))
  }

  return false
}

export function isValidTimeout(value: any): value is number {
  return typeof value === 'number' && value >= 0 && value !== Infinity
}

export function isDocumentVisible(): boolean {
  // document global can be unavailable in react native
  if (typeof document === 'undefined') {
    return true
  }
  return [undefined, 'visible', 'prerender'].includes(document.visibilityState)
}

export function isOnline(): boolean {
  return navigator.onLine === undefined || navigator.onLine
}

export function getQueryArgs<TResult, TError, TOptions = undefined>(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any
): [QueryKey, QueryConfig<TResult, TError>, TOptions] {
  let queryKey: QueryKey
  let queryFn: QueryFunction<TResult> | undefined
  let config: QueryConfig<TResult, TError> | undefined
  let options: TOptions

  if (isPlainObject(arg1)) {
    queryKey = arg1.queryKey
    queryFn = arg1.queryFn
    config = arg1.config
    options = arg2
  } else if (isPlainObject(arg2)) {
    queryKey = arg1
    config = arg2
    options = arg3
  } else {
    queryKey = arg1
    queryFn = arg2
    config = arg3
    options = arg4
  }

  config = config || {}

  if (queryFn) {
    config = { ...config, queryFn }
  }

  return [queryKey, config, options]
}

/**
 * This function returns `a` if `b` is deeply equal.
 * If not, it will replace any deeply equal children of `b` with those of `a`.
 * This can be used for structural sharing between JSON values for example.
 */
export function replaceEqualDeep<T>(a: unknown, b: T): T
export function replaceEqualDeep(a: any, b: any): any {
  if (a === b) {
    return a
  }

  const array = Array.isArray(a) && Array.isArray(b)

  if (array || (isPlainObject(a) && isPlainObject(b))) {
    const aSize = array ? a.length : Object.keys(a).length
    const bItems = array ? b : Object.keys(b)
    const bSize = bItems.length
    const copy: any = array ? [] : {}

    let equalItems = 0

    for (let i = 0; i < bSize; i++) {
      const key = array ? i : bItems[i]
      copy[key] = replaceEqualDeep(a[key], b[key])
      if (copy[key] === a[key]) {
        equalItems++
      }
    }

    return aSize === bSize && equalItems === aSize ? a : copy
  }

  return b
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o: any): o is Object {
  if (!hasObjectPrototype(o)) {
    return false
  }

  // If has modified constructor
  const ctor = o.constructor
  if (typeof ctor === 'undefined') {
    return true
  }

  // If has modified prototype
  const prot = ctor.prototype
  if (!hasObjectPrototype(prot)) {
    return false
  }

  // If constructor does not have an Object-specific method
  if (!prot.hasOwnProperty('isPrototypeOf')) {
    return false
  }

  // Most likely a plain Object
  return true
}

function hasObjectPrototype(o: any): boolean {
  return Object.prototype.toString.call(o) === '[object Object]'
}

export function isCancelable(value: any): value is Cancelable {
  return typeof value?.cancel === 'function'
}

export function isError(value: any): value is Error {
  return value instanceof Error
}

export function isCancelledError(value: any): value is CancelledError {
  return value instanceof CancelledError
}

export function sleep(timeout: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}

export function getStatusProps<T extends QueryStatus>(status: T) {
  return {
    status,
    isLoading: status === QueryStatus.Loading,
    isSuccess: status === QueryStatus.Success,
    isError: status === QueryStatus.Error,
    isIdle: status === QueryStatus.Idle,
  }
}

export function createSetHandler(fn: () => void) {
  let removePreviousHandler: (() => void) | void
  return (callback: (handler: () => void) => void) => {
    // Unsub the old handler
    if (removePreviousHandler) {
      removePreviousHandler()
    }
    // Sub the new handler
    removePreviousHandler = callback(fn)
  }
}

/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
export function scheduleMicrotask(callback: () => void): void {
  Promise.resolve()
    .then(callback)
    .catch(error =>
      setTimeout(() => {
        throw error
      })
    )
}

type BatchUpdateFunction = (callback: () => void) => void

// Default to a dummy "batch" implementation that just runs the callback
let batchedUpdates: BatchUpdateFunction = (callback: () => void) => {
  callback()
}

// Allow injecting another batching function later
export function setBatchedUpdates(fn: BatchUpdateFunction) {
  batchedUpdates = fn
}

// Supply a getter just to skip dealing with ESM bindings
export function getBatchedUpdates(): BatchUpdateFunction {
  return batchedUpdates
}
