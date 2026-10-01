import { createContext, createSignal, useContext } from 'solid-js'
import type { Accessor, JSX, Setter } from 'solid-js'

export interface DevtoolsState {
  selectedQueryHash: Accessor<string | null>
  setSelectedQueryHash: Setter<string | null>
  selectedMutationId: Accessor<number | null>
  setSelectedMutationId: Setter<number | null>
  panelWidth: Accessor<number>
  setPanelWidth: Setter<number>
  offline: Accessor<boolean>
  setOffline: Setter<boolean>
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
  const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
    null,
  )
  const [selectedMutationId, setSelectedMutationId] = createSignal<
    number | null
  >(null)
  const [panelWidth, setPanelWidth] = createSignal(0)
  const [offline, setOffline] = createSignal(false)

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
      }}
    >
      {props.children}
    </DevtoolsStateContext.Provider>
  )
}
