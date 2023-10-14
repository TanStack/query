import { render } from 'solid-js/web'
import { createSignal, lazy } from 'solid-js'
import type {
  QueryClient,
  onlineManager as TonlineManager,
} from '@tanstack/query-core'
import type { DevtoolsComponent } from './Devtools'
import type {
  DevToolsErrorType,
  DevtoolsButtonPosition,
  DevtoolsPosition,
  QueryDevtoolsProps,
} from './Context'
import type { Signal } from 'solid-js'

export type { DevtoolsButtonPosition, DevtoolsPosition, DevToolsErrorType }
export interface TanstackQueryDevtoolsConfig extends QueryDevtoolsProps {}

class TanstackQueryDevtools {
  #client: Signal<QueryClient>
  #onlineManager: typeof TonlineManager
  #queryFlavor: string
  #version: string
  #isMounted = false
  #buttonPosition: Signal<DevtoolsButtonPosition | undefined>
  #position: Signal<DevtoolsPosition | undefined>
  #initialIsOpen: Signal<boolean | undefined>
  #errorTypes: Signal<Array<DevToolsErrorType> | undefined>
  #Component: typeof DevtoolsComponent | undefined
  #dispose?: () => void

  constructor(config: TanstackQueryDevtoolsConfig) {
    const {
      client,
      queryFlavor,
      version,
      onlineManager,
      buttonPosition,
      position,
      initialIsOpen,
      errorTypes,
    } = config
    this.#client = createSignal(client)
    this.#queryFlavor = queryFlavor
    this.#version = version
    this.#onlineManager = onlineManager
    this.#buttonPosition = createSignal(buttonPosition)
    this.#position = createSignal(position)
    this.#initialIsOpen = createSignal(initialIsOpen)
    this.#errorTypes = createSignal(errorTypes)
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

  setErrorTypes(errorTypes: Array<DevToolsErrorType>) {
    this.#errorTypes[1](errorTypes)
  }

  setClient(client: QueryClient) {
    this.#client[1](client)
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
      const [queryClient] = this.#client

      let Devtools: typeof DevtoolsComponent

      if (this.#Component) {
        Devtools = this.#Component
      } else {
        Devtools = lazy(() => import('./Devtools'))
        this.#Component = Devtools
      }

      return (
        <Devtools
          queryFlavor={this.#queryFlavor}
          version={this.#version}
          onlineManager={this.#onlineManager}
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

export { TanstackQueryDevtools }
