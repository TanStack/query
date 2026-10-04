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
  /**
   * The `QueryClient` whose caches the devtools inspect.
   */
  readonly client: QueryClient
  /**
   * The adapter name shown next to the logo in the header, e.g. `'React Query'`.
   */
  queryFlavor: string
  /**
   * The adapter version shown next to `queryFlavor` in the header.
   */
  version: string
  /**
   * The `onlineManager` the devtools read and toggle to simulate going offline.
   */
  onlineManager: typeof onlineManager

  /**
   * The position of the TanStack logo to open and close the devtools panel.
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the devtools panel.
   */
  position?: DevtoolsPosition
  /**
   * Set this to `true` if you want the devtools to default to being open.
   */
  initialIsOpen?: boolean
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType>
  /**
   * Use this so you can attach the devtool's styles to specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Callback function that is called when the devtools panel is closed. Only used by the panel
   * entry point.
   */
  onClose?: () => void
  /**
   * Set this to `true` to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to `'light'`, `'dark'`, or `'system'` to change the theme of the devtools panel.
   */
  theme?: Theme
}

/**
 * The devtools UI state: the selected query and mutation, and the panel width.
 */
export interface DevtoolsState {
  /**
   * The hash of the query whose details are shown, or `null` if none is selected.
   */
  selectedQueryHash: Accessor<string | null>
  /**
   * Selects a query by its hash, or clears the selection with `null`.
   */
  setSelectedQueryHash: Setter<string | null>
  /**
   * The `mutationId` of the mutation whose details are shown, or `null` if none is selected.
   */
  selectedMutationId: Accessor<number | null>
  /**
   * Selects a mutation by its `mutationId`, or clears the selection with `null`.
   */
  setSelectedMutationId: Setter<number | null>
  /**
   * The current width of the devtools panel in pixels, used for the responsive layout.
   */
  panelWidth: Accessor<number>
  /**
   * Updates the stored panel width, e.g. when the panel is resized.
   */
  setPanelWidth: Setter<number>
}

/**
 * The registries through which devtools components subscribe to the query cache and the mutation
 * cache, each one only updating for the cache events it cares about.
 */
export interface DevtoolsSubscriptions {
  /**
   * The registry through which devtools components subscribe to query cache events.
   */
  queryCacheSubscriptions: ReturnType<
    typeof createCacheSubscriptionRegistry<QueryCache, QueryCacheNotifyEvent>
  >
  /**
   * The registry through which devtools components subscribe to mutation cache events.
   */
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
  /**
   * Whether the devtools' `onlineManager` is currently offline.
   */
  offline: Accessor<boolean>
  /**
   * Switches the devtools' `onlineManager` between online and offline.
   */
  toggleOffline: () => void
}
