export { getDefaultReactQueryConfig } from './config'
export { queryCache, queryCaches, makeQueryCache } from './queryCache'
export { setFocusHandler } from './setFocusHandler'
export { setOnlineHandler } from './setOnlineHandler'
export { CancelledError, isCancelledError, isError, setConsole } from './utils'

// Types
export * from './types'
export type { Query } from './query'
export type { QueryCache } from './queryCache'
export type { ConsoleObject } from './utils'
