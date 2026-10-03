import type {
  MutationCache,
  MutationCacheNotifyEvent,
  Query,
  QueryCache,
  QueryCacheNotifyEvent,
  QueryClient,
  onlineManager,
} from '@tanstack/query-core'
import type { Accessor, Setter } from 'solid-js'
import type { createCacheSubscriptionRegistry } from '../createCacheSubscriptionRegistry'

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
  onClose?: () => void
  hideDisabledQueries?: boolean
  theme?: Theme
}

export interface DevtoolsState {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
}

export interface DevtoolsSubscriptions {
  queryCacheSubscriptions: ReturnType<
    typeof createCacheSubscriptionRegistry<QueryCache, QueryCacheNotifyEvent>
  >
  mutationCacheSubscriptions: ReturnType<
    typeof createCacheSubscriptionRegistry<
      MutationCache,
      MutationCacheNotifyEvent
    >
  >
}

export interface DevtoolsOfflineState {
  offline: Accessor<boolean>
  toggleOffline: () => void
}
