import { createContext, useContext } from 'solid-js'
import type { Accessor } from 'solid-js'
import type { Query, QueryClient, onlineManager } from '@tanstack/query-core'

type XPosition = 'left' | 'right'
type YPosition = 'top' | 'bottom'
export type DevtoolsPosition = XPosition | YPosition
export type DevtoolsButtonPosition = `${YPosition}-${XPosition}`

export interface DevToolsErrorType {
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
  errorTypes?: Array<DevToolsErrorType>
}

export const QueryDevtoolsContext = createContext<QueryDevtoolsProps>({
  client: undefined as unknown as QueryClient,
  onlineManager: undefined as unknown as typeof onlineManager,
  queryFlavor: '',
  version: '',
})

export function useQueryDevtoolsContext() {
  return useContext(QueryDevtoolsContext)
}

export const ThemeContext = createContext<Accessor<'light' | 'dark'>>(
  () => 'dark' as const,
)

export function useTheme() {
  return useContext(ThemeContext)
}
