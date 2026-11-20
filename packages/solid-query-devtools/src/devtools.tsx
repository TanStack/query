import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import { onlineManager, useQueryClient } from '@tanstack/solid-query'
import { createEffect, createMemo, onCleanup, onMount } from 'solid-js'
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
   * The position of the TanStack logo to open and close the devtools panel.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative'
   * @defaultValue bottom-right
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the Solid Query devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * @defaultValue bottom
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
   * @deprecated The devtools no longer add a `<style>` element, so they need no
   * nonce. This option does nothing.
   */
  styleNonce?: string
  /**
   * The shadow root to add the devtools styles to. By default, the styles are
   * added to the shadow root the devtools render in, or to the document when
   * they do not render in a shadow root.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
   * This overrides the theme selected in the devtools Settings menu. When omitted, the
   * selected theme is used, or `'system'` if none is selected.
   */
  theme?: Theme
}

/**
 * Renders the TanStack Query devtools, with a toggle button that opens them, for the given or
 * nearest `QueryClient`.
 * @param props - The devtools options.
 * @returns The element the devtools are mounted in.
 */
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
    shadowDOMTarget: props.shadowDOMTarget,
    hideDisabledQueries: props.hideDisabledQueries,
    theme: props.theme,
  })

  createEffect(() => {
    devtools.setClient(client())
  })

  createEffect(() => {
    const buttonPos = props.buttonPosition
    if (buttonPos) {
      devtools.setButtonPosition(buttonPos)
    }
  })

  createEffect(() => {
    const pos = props.position
    if (pos) {
      devtools.setPosition(pos)
    }
  })

  createEffect(() => {
    devtools.setInitialIsOpen(props.initialIsOpen || false)
  })

  createEffect(() => {
    devtools.setErrorTypes(props.errorTypes || [])
  })

  createEffect(() => {
    devtools.setTheme(props.theme)
  })

  onMount(() => {
    devtools.mount(ref)
    onCleanup(() => devtools.unmount())
  })

  return <div class="tsqd-parent-container" ref={ref} />
}
