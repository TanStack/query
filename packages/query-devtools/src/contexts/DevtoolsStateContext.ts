import { createContext, useContext } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'
import type {
  MutationCache,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'

type QueryCacheMapValue = {
  setter: Setter<any>
  shouldUpdate: (event: QueryCacheNotifyEvent) => boolean
}

type MutationCacheMapValue = {
  setter: Setter<any>
}

export type QueryCacheMap = Map<
  (q: Accessor<QueryCache>) => any,
  QueryCacheMapValue
>

export type MutationCacheMap = Map<
  (q: Accessor<MutationCache>) => any,
  MutationCacheMapValue
>

interface DevtoolsState {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
  offline: Accessor<boolean>
  setOffline: Setter<boolean>
  queryCacheMap: QueryCacheMap
  mutationCacheMap: MutationCacheMap
}

export const DevtoolsStateContext = createContext<DevtoolsState>()

export function useDevtoolsState() {
  return useContext(DevtoolsStateContext)!
}
