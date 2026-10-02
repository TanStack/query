import { createSignal } from 'solid-js'
import { DevtoolsStateContext } from '../contexts/DevtoolsStateContext'
import type { DevtoolsState } from '../contexts/types'
import type { ParentProps } from 'solid-js'

export function DevtoolsStateProvider(props: ParentProps) {
  const [selectedQueryHash, setSelectedQueryHash] = createSignal<string | null>(
    null,
  )
  const [selectedMutationId, setSelectedMutationId] = createSignal<
    number | null
  >(null)
  const [panelWidth, setPanelWidth] = createSignal(0)

  const state: DevtoolsState = {
    selectedQueryHash,
    setSelectedQueryHash,
    selectedMutationId,
    setSelectedMutationId,
    panelWidth,
    setPanelWidth,
  }
  return (
    <DevtoolsStateContext.Provider value={state}>
      {props.children}
    </DevtoolsStateContext.Provider>
  )
}
