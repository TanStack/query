import type {
  QueryClient,
  onlineManager as TonlineManager,
} from '@tanstack/query-core'
import { DevtoolsComponent } from './Devtools'
import { render } from 'solid-js/web'
import type {
  DevtoolsButtonPosition,
  DevtoolsPosition,
  QueryDevtoolsProps,
  DevToolsErrorType,
} from './Context'
import type { Signal } from 'solid-js'
import { createSignal } from 'solid-js'

export type { DevtoolsButtonPosition, DevtoolsPosition, DevToolsErrorType }
export interface TanstackQueryDevtoolsConfig extends QueryDevtoolsProps {}

class TanstackQueryDevtools {
  client: QueryClient
  onlineManager: typeof TonlineManager
  queryFlavor: string
  version: string
  isMounted = false
  buttonPosition: Signal<DevtoolsButtonPosition | undefined>
  position: Signal<DevtoolsPosition | undefined>
  initialIsOpen: Signal<boolean | undefined>
  errorTypes: Signal<DevToolsErrorType[] | undefined>
  dispose?: () => void

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
    this.client = client
    this.queryFlavor = queryFlavor
    this.version = version
    this.onlineManager = onlineManager
    this.buttonPosition = createSignal(buttonPosition)
    this.position = createSignal(position)
    this.initialIsOpen = createSignal(initialIsOpen)
    this.errorTypes = createSignal(errorTypes)
  }

  setButtonPosition(position: DevtoolsButtonPosition) {
    this.buttonPosition[1](position)
  }

  setPosition(position: DevtoolsPosition) {
    this.position[1](position)
  }

  setInitialIsOpen(isOpen: boolean) {
    this.initialIsOpen[1](isOpen)
  }

  setErrorTypes(errorTypes: DevToolsErrorType[]) {
    this.errorTypes[1](errorTypes)
  }

  mount<T extends HTMLElement>(el: T) {
    if (this.isMounted) {
      throw new Error('Devtools is already mounted')
    }
    const dispose = render(() => {
      const [btnPosition] = this.buttonPosition
      const [pos] = this.position
      const [isOpen] = this.initialIsOpen
      const [errors] = this.errorTypes
      return (
        <DevtoolsComponent
          client={this.client}
          queryFlavor={this.queryFlavor}
          version={this.version}
          onlineManager={this.onlineManager}
          {...{
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
    this.isMounted = true
    this.dispose = dispose
  }

  unmount() {
    if (!this.isMounted) {
      throw new Error('Devtools is not mounted')
    }
    this.dispose?.()
    this.isMounted = false
  }
}

export { TanstackQueryDevtools }
