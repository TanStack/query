import { createContext, useContext } from 'solid-js'
import type { QueryClient, onlineManager } from '@tanstack/query-core'
import type { QueryDevtoolsProps } from './types'

export type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  QueryDevtoolsProps,
  Theme,
} from './types'

export const QueryDevtoolsContext = createContext<QueryDevtoolsProps>({
  client: undefined as unknown as QueryClient,
  onlineManager: undefined as unknown as typeof onlineManager,
  queryFlavor: '',
  version: '',
  shadowDOMTarget: undefined,
})

export function useQueryDevtoolsContext() {
  return useContext(QueryDevtoolsContext)
}
