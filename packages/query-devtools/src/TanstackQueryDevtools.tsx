import { createSignal, lazy } from 'solid-js'
import { render, setTrustedTypesPolicy } from 'solid-js/web'
import type {
  QueryClient,
  onlineManager as TOnlineManager,
} from '@tanstack/query-core'
import type { Signal } from 'solid-js'
import type { DevtoolsComponentType } from './Devtools'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  QueryDevtoolsProps,
  Theme,
} from './contexts/types'

/**
 * The options for `TanstackQueryDevtools`, which mounts the floating devtools.
 */
export interface TanstackQueryDevtoolsConfig extends QueryDevtoolsProps {
  /**
   * @deprecated The devtools no longer add a `<style>` element, so they need no nonce. This option
   * does nothing.
   */
  styleNonce?: string
  /**
   * The shadow root to add the devtools styles to. By default, the styles are added to the shadow
   * root the devtools render in, or to the document when they do not render in a shadow root.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * The Trusted Types policy the devtools use to create their HTML templates.
   * Pass one when your page enforces `require-trusted-types-for 'script'`.
   * The devtools only pass it their own markup.
   */
  trustedTypesPolicy?: { createHTML: (html: string) => unknown }
}

class TanstackQueryDevtools {
  #client: Signal<QueryClient>
  #onlineManager: typeof TOnlineManager
  #queryFlavor: string
  #version: string
  #isMounted = false
  #shadowDOMTarget?: ShadowRoot
  #trustedTypesPolicy?: { createHTML: (html: string) => unknown }
  #buttonPosition: Signal<DevtoolsButtonPosition | undefined>
  #position: Signal<DevtoolsPosition | undefined>
  #initialIsOpen: Signal<boolean | undefined>
  #errorTypes: Signal<Array<DevtoolsErrorType> | undefined>
  #hideDisabledQueries: Signal<boolean | undefined>
  #Component: DevtoolsComponentType | undefined
  #theme: Signal<Theme | undefined>
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
      shadowDOMTarget,
      trustedTypesPolicy,
      hideDisabledQueries,
      theme,
    } = config
    this.#client = createSignal(client)
    this.#queryFlavor = queryFlavor
    this.#version = version
    this.#onlineManager = onlineManager
    this.#shadowDOMTarget = shadowDOMTarget
    this.#trustedTypesPolicy = trustedTypesPolicy
    this.#buttonPosition = createSignal(buttonPosition)
    this.#position = createSignal(position)
    this.#initialIsOpen = createSignal(initialIsOpen)
    this.#errorTypes = createSignal(errorTypes)
    this.#hideDisabledQueries = createSignal(hideDisabledQueries)
    this.#theme = createSignal(theme)
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

  setTheme(theme?: Theme) {
    this.#theme[1](theme)
  }

  mount<T extends HTMLElement>(el: T) {
    if (this.#isMounted) {
      throw new Error('Devtools is already mounted')
    }
    // Solid creates each template once, so set the policy before rendering.
    // It is shared by every devtools instance, so never reset it.
    if (this.#trustedTypesPolicy) {
      setTrustedTypesPolicy(this.#trustedTypesPolicy)
    }
    const dispose = render(() => {
      const [btnPosition] = this.#buttonPosition
      const [pos] = this.#position
      const [isOpen] = this.#initialIsOpen
      const [errors] = this.#errorTypes
      const [hideDisabledQueries] = this.#hideDisabledQueries
      const [queryClient] = this.#client
      const [theme] = this.#theme
      let Devtools: DevtoolsComponentType

      if (this.#Component) {
        Devtools = this.#Component
      } else {
        Devtools = lazy(() => import('./DevtoolsComponent'))
        this.#Component = Devtools
      }

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
            get theme() {
              return theme()
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
