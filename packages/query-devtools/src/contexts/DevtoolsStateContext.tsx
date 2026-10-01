import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js'
import type { Accessor, JSX, Setter } from 'solid-js'
import type {
  MutationCache,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'
import { useQueryDevtoolsContext } from './QueryDevtoolsContext'

export interface DevtoolsState {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
  offline: Accessor<boolean>
  setOffline: Setter<boolean>
  /**
   * Registries of cache-subscription callbacks for this devtools instance.
   * Previously these lived at module scope, so a cache notification for one
   * client's cache invoked every mounted panel's callbacks with the wrong
   * cache, and unmounting one panel cleared the other panels' registrations.
   * See https://github.com/TanStack/query/issues/9681
   */
  queryCacheMap: Map<
    (queryCache: Accessor<QueryCache>) => any,
    {
      setter: Setter<any>
      shouldUpdate: (event: QueryCacheNotifyEvent) => boolean
    }
  >
  mutationCacheMap: Map<(mutationCache: Accessor<MutationCache>) => any, Setter<any>>
}

const DevtoolsStateContext = createContext<DevtoolsState | undefined>(undefined)

export function useDevtoolsState(): DevtoolsState {
  const state = useContext(DevtoolsStateContext)
  if (!state) {
    throw new Error(
      'useDevtoolsState must be used within a DevtoolsStateProvider',
    )
  }
  return state
}

export function DevtoolsStateProvider(props: { children: JSX.Element }) {
  // This state is intentionally created inside the provider component so that
  // every mounted devtools instance gets its own isolated copy. Previously
  // these signals lived at module scope, which meant that interacting with
  // one devtools panel (e.g. selecting a query) leaked into every other
  // panel on the page. See https://github.com/TanStack/query/issues/9681
  const onlineManager = createMemo(
    () => useQueryDevtoolsContext().onlineManager,
  )
  const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
    null,
  )
  const [selectedMutationId, setSelectedMutationId] = createSignal<
    number | null
  >(null)
  const [panelWidth, setPanelWidth] = createSignal(0)
  const [offline, setOffline] = createSignal(!onlineManager().isOnline())
  const queryCacheMap: DevtoolsState['queryCacheMap'] = new Map()
  const mutationCacheMap: DevtoolsState['mutationCacheMap'] = new Map()

  // The online/offline subscription lives here (rather than in `Devtools`)
  // so that panel-only instances, which render `ContentView` without
  // `Devtools`, reflect their configured onlineManager too.
  createEffect(() => {
    const manager = onlineManager()
    setOffline(!manager.isOnline())
    const unsubscribe = manager.subscribe((online) => {
      setOffline(!online)
    })
    onCleanup(unsubscribe)
  })

  return (
    <DevtoolsStateContext.Provider
      value={{
        selectedQueryHash,
        setSelectedQueryHash,
        selectedMutationId,
        setSelectedMutationId,
        panelWidth,
        setPanelWidth,
        offline,
        setOffline,
        queryCacheMap,
        mutationCacheMap,
      }}
    >
      {props.children}
    </DevtoolsStateContext.Provider>
  )
}
