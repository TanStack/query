import { createContext, createSignal, useContext } from 'solid-js'
import type { Accessor, JSX, Setter } from 'solid-js'
import type {
  MutationCache,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'

interface DevtoolsUiProviderProps {
  children: JSX.Element
}

interface QueryCacheBatcherEntry {
  setter: Setter<any>
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean
}

export interface DevtoolsUiContextValue {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
  offline: Accessor<boolean>
  setOffline: Setter<boolean>
  /**
   * Registry of active query-row subscriptions for this Devtools instance.
   * Keeping this per-instance (instead of module-level) prevents two mounted
   * Devtools panels from cross-notifying each other's rows when their
   * underlying query caches differ.
   */
  queryCacheMap: Map<(q: Accessor<QueryCache>) => any, QueryCacheBatcherEntry>
  mutationCacheMap: Map<(q: Accessor<MutationCache>) => any, Setter<any>>
}

const DevtoolsUiContext = createContext<DevtoolsUiContextValue | undefined>(
  undefined,
)

/**
 * Owns the UI/selection state and cache-subscription registries for a single
 * mounted Devtools instance (button + panel, or standalone panel).
 *
 * This state used to live in module-level signals/maps in `Devtools.tsx`,
 * which meant every `TanstackQueryDevtools` instance mounted on a page
 * (e.g. two panels pointing at two different `QueryClient`s) shared the same
 * selected query/mutation, panel width, and cache-subscription registry.
 * That caused actions in one panel (selecting a query, resizing, etc.) to
 * leak into every other panel. See:
 * https://github.com/TanStack/query/issues/9681
 */
export function DevtoolsUiProvider(props: DevtoolsUiProviderProps) {
  const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
    null,
  )
  const [selectedMutationId, setSelectedMutationId] = createSignal<
    number | null
  >(null)
  const [panelWidth, setPanelWidth] = createSignal(0)
  const [offline, setOffline] = createSignal(false)

  const value: DevtoolsUiContextValue = {
    selectedQueryHash,
    setSelectedQueryHash,
    selectedMutationId,
    setSelectedMutationId,
    panelWidth,
    setPanelWidth,
    offline,
    setOffline,
    queryCacheMap: new Map(),
    mutationCacheMap: new Map(),
  }

  return (
    <DevtoolsUiContext.Provider value={value}>
      {props.children}
    </DevtoolsUiContext.Provider>
  )
}

export function useDevtoolsUiContext() {
  const context = useContext(DevtoolsUiContext)
  if (!context) {
    throw new Error(
      'useDevtoolsUiContext must be used within a DevtoolsUiProvider',
    )
  }
  return context
}
