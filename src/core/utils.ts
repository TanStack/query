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

export class CancelledError {}

// UTILS

let _uid = 0
export const uid = () => _uid++

export const isServer = typeof window === 'undefined'

function noop(): void {
  return void 0
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
    throw new Error('Cannot stringify non JSON value')
  }

  if (isObject(value)) {
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
  args: any[]
): [QueryKey, QueryConfig<TResult, TError>, TOptions] {
  let queryKey: QueryKey
  let queryFn: QueryFunction<TResult> | undefined
  let config: QueryConfig<TResult, TError> | undefined
  let options: TOptions

  if (isObject(args[0])) {
    queryKey = args[0].queryKey
    queryFn = args[0].queryFn
    config = args[0].config
    options = args[1]
  } else if (isObject(args[1])) {
    queryKey = args[0]
    config = args[1]
    options = args[2]
  } else {
    queryKey = args[0]
    queryFn = args[1]
    config = args[2]
    options = args[3]
  }

  config = config ? { queryKey, ...config } : { queryKey }

  if (queryFn) {
    config = { ...config, queryFn }
  }

  return [queryKey, config, options]
}

export function deepEqual(a: any, b: any): boolean {
  return replaceEqualDeep(a, b) === a
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

export function isObject(a: unknown): boolean {
  return a && typeof a === 'object' && !Array.isArray(a)
}

// Copied from: https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o: any): o is Object {
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
