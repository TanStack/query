export { Query } from './query'
export { QueryCache } from './queryCache'
export { QueryClient } from './queryClient'
export { setBatchedUpdates } from './notifyManager'
export { setConsole } from './setConsole'
export { setFocusHandler } from './setFocusHandler'
export { setOnlineHandler } from './setOnlineHandler'
export {
  CancelledError,
  isCancelledError,
  isError,
  defaultQueryKeySerializerFn,
} from './utils'

// Types
export * from './types'
export type { ConsoleObject } from './setConsole'
