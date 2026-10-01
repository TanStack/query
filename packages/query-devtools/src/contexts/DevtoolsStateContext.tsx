import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js'
import { useQueryDevtoolsContext } from './QueryDevtoolsContext'
import type { Accessor, ParentProps, Setter } from 'solid-js'

interface DevtoolsState {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
  offline: Accessor<boolean>
  setOffline: Setter<boolean>
}

const DevtoolsStateContext = createContext<DevtoolsState>()

export function DevtoolsStateProvider(props: ParentProps) {
  const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
    null,
  )
  const [selectedMutationId, setSelectedMutationId] = createSignal<
    number | null
  >(null)
  const [panelWidth, setPanelWidth] = createSignal(0)
  const [offline, setOffline] = createSignal(false)

  const state: DevtoolsState = {
    selectedQueryHash,
    setSelectedQueryHash,
    selectedMutationId,
    setSelectedMutationId,
    panelWidth,
    setPanelWidth,
    offline,
    setOffline,
  }
  const context = useQueryDevtoolsContext()
  createEffect(() => {
    const manager = context.onlineManager
    state.setOffline(!manager.isOnline())
    const unsubscribe = manager.subscribe((online) => state.setOffline(!online))
    onCleanup(unsubscribe)
  })
  return (
    <DevtoolsStateContext.Provider value={state}>
      {props.children}
    </DevtoolsStateContext.Provider>
  )
}

export function useDevtoolsState() {
  const state = useContext(DevtoolsStateContext)
  if (!state) throw new Error('Missing DevtoolsStateProvider')
  return state
}
