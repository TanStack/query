import { createContext, useContext } from 'solid-js'
import type { Query, QueryClient, onlineManager } from '@tanstack/query-core'

type XPosition = 'left' | 'right'
type YPosition = 'top' | 'bottom'
export type DevtoolsPosition = XPosition | YPosition
export type DevtoolsButtonPosition = `${YPosition}-${XPosition}` | 'relative'
export type Theme = 'dark' | 'light' | 'system'

export interface DevtoolsErrorType {
  /**
   * The name of the error.
   */
  name: string
  /**
   * How the error is initialized.
   */
  initializer: (query: Query) => Error
}

export interface QueryDevtoolsProps {
  readonly client: QueryClient
  queryFlavor: string
  version: string
  onlineManager: typeof onlineManager

  buttonPosition?: DevtoolsButtonPosition
  position?: DevtoolsPosition
  initialIsOpen?: boolean
  errorTypes?: Array<DevtoolsErrorType>
  shadowDOMTarget?: ShadowRoot
  onClose?: () => unknown
  hideDisabledQueries?: boolean
  theme?: Theme
}

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
