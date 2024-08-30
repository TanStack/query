import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  sharedConfig,
  splitProps,
  untrack,
} from 'solid-js'
import { onlineManager, useQueryClient } from '@tanstack/solid-query'
import { isServer } from 'solid-js/web'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/solid-query'
import type { Component, ComponentProps, JSX } from 'solid-js'

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
}

export default function SolidQueryDevtools(props: DevtoolsOptions) {
  const queryClient = useQueryClient()
  const client = createMemo(() => props.client || queryClient)
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

  onMount(() => {
    devtools.mount(ref)
    onCleanup(() => devtools.unmount())
  })

  return <div class="tsqd-parent-container" ref={ref}></div>
}

/*
  This function has been taken from solid-start's codebase
  This allows the devtools to be loaded only on the client and bypasses any server side rendering
  https://github.com/solidjs/solid-start/blob/2967fc2db3f0df826f061020231dbdafdfa0746b/packages/start/islands/clientOnly.tsx
*/
export function clientOnly<T extends Component<any>>(
  fn: () => Promise<{
    default: T
  }>,
) {
  if (isServer)
    return (props: ComponentProps<T> & { fallback?: JSX.Element }) =>
      props.fallback

  const [comp, setComp] = createSignal<T>()
  fn().then((m) => setComp(() => m.default))
  return (props: ComponentProps<T>) => {
    let Comp: T | undefined
    let m: boolean
    const [, rest] = splitProps(props, ['fallback'])
    if ((Comp = comp()) && !sharedConfig.context) return Comp(rest)
    const [mounted, setMounted] = createSignal(!sharedConfig.context)
    onMount(() => setMounted(true))
    return createMemo(
      () => (
        (Comp = comp()),
        (m = mounted()),
        untrack(() => (Comp && m ? Comp(rest) : props.fallback))
      ),
    )
  }
}
