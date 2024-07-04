import type { Signal } from 'solid-js'
import { createSignal, lazy } from 'solid-js'
import { render } from 'solid-js/web'
import type {
  QueryClient,
  onlineManager as TOnlineManager,
} from '@tanstack/query-core'
import type { DevtoolsErrorType, DevtoolsPosition, QueryDevtoolsProps } from './contexts'
import type { DevtoolsPanelComponentType } from './DevtoolsPanelComponent'
import { setupStyleSheet } from './utils'

export interface TanstackQueryDevtoolsPanelConfig extends Omit<QueryDevtoolsProps, 'buttonPosition'> {
  styleNonce?: string
  shadowDOMTarget?: ShadowRoot
}

class TanstackQueryDevtoolsPanel {
  #client: Signal<QueryClient>
  #onlineManager: typeof TOnlineManager
  #queryFlavor: string
  #version: string
  #isMounted = false
  #styleNonce?: string
  #shadowDOMTarget?: ShadowRoot
  #position: Signal<DevtoolsPosition | undefined>
  #isOpen: Signal<boolean | undefined>
  #errorTypes: Signal<Array<DevtoolsErrorType> | undefined>
  #Component: DevtoolsPanelComponentType | undefined
  #dispose?: () => void

  constructor(config: TanstackQueryDevtoolsPanelConfig) {
    const {
      client,
      queryFlavor,
      version,
      onlineManager,
      position,
      isOpen,
      errorTypes,
      styleNonce,
      shadowDOMTarget,
    } = config
    this.#client = createSignal(client)
    this.#queryFlavor = queryFlavor
    this.#version = version
    this.#onlineManager = onlineManager
    this.#styleNonce = styleNonce
    this.#shadowDOMTarget = shadowDOMTarget
    this.#position = createSignal(position)
    this.#isOpen = createSignal(isOpen)
    this.#errorTypes = createSignal(errorTypes)
  }

  setPosition(position: DevtoolsPosition) {
    this.#position[1](position)
  }

  setIsOpen(isOpen: boolean) {
    this.#isOpen[1](isOpen)
  }

  setErrorTypes(errorTypes: Array<DevtoolsErrorType>) {
    this.#errorTypes[1](errorTypes)
  }

  setClient(client: QueryClient) {
    this.#client[1](client)
  }

  mount<T extends HTMLElement>(el: T) {
    if (this.#isMounted) {
      throw new Error('DevtoolsPanel is already mounted')
    }
    const dispose = render(() => {
      const [pos] = this.#position
      const [isOpen] = this.#isOpen
      const [errors] = this.#errorTypes
      const [queryClient] = this.#client
      let Devtools: DevtoolsPanelComponentType

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
            get position() {
              return pos()
            },
            get isOpen() {
              return isOpen()
            },
            get errorTypes() {
              return errors()
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
      throw new Error('DevtoolsPanel is not mounted')
    }
    this.#dispose?.()
    this.#isMounted = false
  }
}

export { TanstackQueryDevtoolsPanel }
