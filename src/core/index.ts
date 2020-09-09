export { getDefaultReactQueryConfig } from './config'
export {
  queryCache,
  queryCaches,
  makeQueryCache,
  QueryCache,
} from './queryCache'
export { setFocusHandler } from './setFocusHandler'
export { setOnlineHandler } from './setOnlineHandler'
export {
  CancelledError,
  isCancelledError,
  isError,
  setConsole,
  setBatchedUpdates,
} from './utils'

// Types
export * from './types'
export type { Query } from './query'
export type { ConsoleObject } from './utils'
