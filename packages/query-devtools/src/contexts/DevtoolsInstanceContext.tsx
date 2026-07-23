import { createContext, createSignal, useContext } from 'solid-js'
import type { Accessor, JSX, Setter } from 'solid-js'
import type { MutationCache, QueryCache, QueryCacheNotifyEvent } from '@tanstack/query-core'

interface QueryCacheSubscriber {
  setter: Setter<any>
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean
}

export interface DevtoolsInstanceContextType {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
  offline: Accessor<boolean>
  setOffline: Setter<boolean>
  queryCacheMap: Map<(q: Accessor<QueryCache>) => any, QueryCacheSubscriber>
  mutationCacheMap: Map<(q: Accessor<MutationCache>) => any, Setter<any>>
}

const DevtoolsInstanceContext = createContext<DevtoolsInstanceContextType>()

/**
 * Every rendered devtools root (the floating panel and the standalone panel)
 * mounts one of these, so that UI state which used to live in module-level
 * signals — selection, panel width, the offline mock toggle, and the query
 * / mutation cache subscription maps — doesn't leak between independently
 * mounted devtools instances.
 */
export const DevtoolsInstanceProvider = (props: { children: JSX.Element }) => {
  const [selectedQueryHash, setSelectedQueryHash] = createSignal<
    string | null
  >(null)
  const [selectedMutationId, setSelectedMutationId] = createSignal<
    number | null
  >(null)
  const [panelWidth, setPanelWidth] = createSignal(0)
  const [offline, setOffline] = createSignal(false)

  const value: DevtoolsInstanceContextType = {
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
    <DevtoolsInstanceContext.Provider value={value}>
      {props.children}
    </DevtoolsInstanceContext.Provider>
  )
}

export function useDevtoolsInstanceContext() {
  const context = useContext(DevtoolsInstanceContext)
  if (!context) {
    throw new Error(
      'useDevtoolsInstanceContext must be used within a DevtoolsInstanceProvider',
    )
  }
  return context
}
