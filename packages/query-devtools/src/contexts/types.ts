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

/**
 * The side of the screen the devtools panel opens on.
 */
export type DevtoolsPosition = XPosition | YPosition
/**
 * The corner of the screen the toggle button is placed in, or `'relative'` to place it in the
 * normal document flow.
 */
export type DevtoolsButtonPosition = `${YPosition}-${XPosition}` | 'relative'
/**
 * The color theme of the devtools. `'system'` follows the user's color scheme preference.
 */
export type Theme = 'dark' | 'light' | 'system'

/**
 * A custom error that can be triggered on a query from the devtools.
 */
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

/**
 * The options shared by every devtools entry point: the `client` to inspect, the adapter's
 * `queryFlavor` and `version` shown in the header, and the display options.
 * `onClose` is only used by the panel entry point.
 */
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

/**
 * The devtools UI state: the selected query and mutation, and the panel width.
 */
export interface DevtoolsState {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
}

/**
 * The registries through which devtools components subscribe to the query cache and the mutation
 * cache, each one only updating for the cache events it cares about.
 */
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

/**
 * Whether the devtools' `onlineManager` is offline, and a function that toggles it.
 */
export interface DevtoolsOfflineState {
  offline: Accessor<boolean>
  toggleOffline: () => void
}
