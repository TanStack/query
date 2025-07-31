import { render } from 'solid-js/web'
import { createSignal, lazy } from 'solid-js'
import { setupStyleSheet } from './utils'
import type {
  QueryClient,
  onlineManager as TOnlineManager,
} from '@tanstack/query-core'
import type { DevtoolsComponentType } from './Devtools'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  QueryDevtoolsProps,
} from './contexts'
import type { Signal } from 'solid-js'

export interface TanstackQueryDevtoolsPanelConfig extends QueryDevtoolsProps {
  styleNonce?: string
  shadowDOMTarget?: ShadowRoot
  onClose?: () => unknown
}

class TanstackQueryDevtoolsPanel {
  #client: Signal<QueryClient>
  #onlineManager: typeof TOnlineManager
  #queryFlavor: string
  #version: string
  #isMounted = false
  #styleNonce?: string
  #shadowDOMTarget?: ShadowRoot
  #buttonPosition: Signal<DevtoolsButtonPosition | undefined>
  #position: Signal<DevtoolsPosition | undefined>
  #initialIsOpen: Signal<boolean | undefined>
  #errorTypes: Signal<Array<DevtoolsErrorType> | undefined>
  #hideDisabledQueries: Signal<boolean | undefined>
  #onClose: Signal<(() => unknown) | undefined>
  #Component: DevtoolsComponentType | undefined
  #dispose?: () => void

  constructor(config: TanstackQueryDevtoolsPanelConfig) {
    const {
      client,
      queryFlavor,
      version,
      onlineManager,
      buttonPosition,
      position,
      initialIsOpen,
      errorTypes,
      styleNonce,
      shadowDOMTarget,
      onClose,
      hideDisabledQueries,
    } = config
    this.#client = createSignal(client)
    this.#queryFlavor = queryFlavor
    this.#version = version
    this.#onlineManager = onlineManager
    this.#styleNonce = styleNonce
    this.#shadowDOMTarget = shadowDOMTarget
    this.#buttonPosition = createSignal(buttonPosition)
    this.#position = createSignal(position)
    this.#initialIsOpen = createSignal(initialIsOpen)
    this.#errorTypes = createSignal(errorTypes)
    this.#hideDisabledQueries = createSignal(hideDisabledQueries)
    this.#onClose = createSignal(onClose)
  }

  setButtonPosition(position: DevtoolsButtonPosition) {
    this.#buttonPosition[1](position)
  }

  setPosition(position: DevtoolsPosition) {
    this.#position[1](position)
  }

  setInitialIsOpen(isOpen: boolean) {
    this.#initialIsOpen[1](isOpen)
  }

  setErrorTypes(errorTypes: Array<DevtoolsErrorType>) {
    this.#errorTypes[1](errorTypes)
  }

  setClient(client: QueryClient) {
    this.#client[1](client)
  }

  setOnClose(onClose: () => unknown) {
    this.#onClose[1](() => onClose)
  }

  mount<T extends HTMLElement>(el: T) {
    if (this.#isMounted) {
      throw new Error('Devtools is already mounted')
    }
    const dispose = render(() => {
      const [btnPosition] = this.#buttonPosition
      const [pos] = this.#position
      const [isOpen] = this.#initialIsOpen
      const [errors] = this.#errorTypes
      const [hideDisabledQueries] = this.#hideDisabledQueries
      const [queryClient] = this.#client
      const [onClose] = this.#onClose
      let Devtools: DevtoolsComponentType

      if (this.#Component) {
        Devtools = this.#Component
      } else {
        Devtools = lazy(() => import('./DevtoolsPanelComponent'))
        this.#Component = Devtools
      }

      setupStyleSheet(this.#styleNonce, this.#shadowDOMTarget)
      return (
        <Devtools
          queryFlavor={this.#queryFlavor}
          version={this.#version}
          onlineManager={this.#onlineManager}
          shadowDOMTarget={this.#shadowDOMTarget}
          {...{
            get client() {
              return queryClient()
            },
            get buttonPosition() {
              return btnPosition()
            },
            get position() {
              return pos()
            },
            get initialIsOpen() {
              return isOpen()
            },
            get errorTypes() {
              return errors()
            },
            get hideDisabledQueries() {
              return hideDisabledQueries()
            },
            get onClose() {
              return onClose()
            },
          }}
        />
      )
    }, el)
    this.#isMounted = true
    this.#dispose = dispose
  }

  unmount() {
    if (!this.#isMounted) {
      throw new Error('Devtools is not mounted')
    }
    this.#dispose?.()
    this.#isMounted = false
  }
}

export { TanstackQueryDevtoolsPanel }
