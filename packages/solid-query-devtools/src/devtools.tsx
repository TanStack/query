import { createEffect, createMemo, onCleanup, onSettled } from 'solid-js'
import { onlineManager, useQueryClient } from '@tanstack/solid-query'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/solid-query'

interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the React Query logo to open and close the devtools panel.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
   * Defaults to 'bottom-right'.
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the React Query devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * Defaults to 'bottom'.
   */
  position?: DevtoolsPosition
  /**
   * Custom instance of QueryClient
   */
  client?: QueryClient
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType>
  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this so you can attach the devtool's styles to specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
   * Defaults to 'system'.
   */
  theme?: Theme
}

export default function SolidQueryDevtools(props: DevtoolsOptions) {
  const queryClient = useQueryClient(props.client)
  const client = createMemo(() => queryClient)
  let ref!: HTMLDivElement
  const devtools = new TanstackQueryDevtools({
    client: client(),
    queryFlavor: 'Solid Query',
    version: '5',
    onlineManager,
    buttonPosition: props.buttonPosition,
    position: props.position,
    initialIsOpen: props.initialIsOpen,
    errorTypes: props.errorTypes,
    styleNonce: props.styleNonce,
    shadowDOMTarget: props.shadowDOMTarget,
    hideDisabledQueries: props.hideDisabledQueries,
    theme: props.theme,
  })

  createEffect(
    () => client(),
    (c) => {
      devtools.setClient(c)
    },
  )

  createEffect(
    () => props.buttonPosition,
    (buttonPos) => {
      if (buttonPos) {
        devtools.setButtonPosition(buttonPos)
      }
    },
  )

  createEffect(
    () => props.position,
    (pos) => {
      if (pos) {
        devtools.setPosition(pos)
      }
    },
  )

  createEffect(
    () => props.initialIsOpen,
    (initialIsOpen) => {
      devtools.setInitialIsOpen(initialIsOpen || false)
    },
  )

  createEffect(
    () => props.errorTypes,
    (errorTypes) => {
      devtools.setErrorTypes(errorTypes || [])
    },
  )

  createEffect(
    () => props.theme,
    (theme) => {
      devtools.setTheme(theme || 'system')
    },
  )

  onSettled(() => {
    devtools.mount(ref)
    onCleanup(() => devtools.unmount())
  })

  return <div class="tsqd-parent-container" ref={ref}></div>
}
