import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js'
import { useQueryDevtoolsContext } from './QueryDevtoolsContext'
import type { ParentProps } from 'solid-js'

function createDevtoolsState() {
  const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
    null,
  )
  const [selectedMutationId, setSelectedMutationId] = createSignal<
    number | null
  >(null)
  const [panelWidth, setPanelWidth] = createSignal(0)
  const [offline, setOffline] = createSignal(false)

  return {
    selectedQueryHash,
    setSelectedQueryHash,
    selectedMutationId,
    setSelectedMutationId,
    panelWidth,
    setPanelWidth,
    offline,
    setOffline,
  }
}

const DevtoolsStateContext =
  createContext<ReturnType<typeof createDevtoolsState>>()

export function DevtoolsStateProvider(props: ParentProps) {
  const state = createDevtoolsState()
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
