import {
  createMemo,
  createSignal,
  onMount,
  sharedConfig,
  splitProps,
  untrack,
} from 'solid-js'
import { isServer } from 'solid-js/web'
import type { Component, ComponentProps, JSX } from 'solid-js'

/**
 * This function has been taken from solid-start's codebase:
 * <https://github.com/solidjs/solid-start/blob/2967fc2db3f0df826f061020231dbdafdfa0746b/packages/start/islands/clientOnly.tsx>.
 * This allows the devtools to be loaded only on the client and bypasses any server side rendering.
 * @param fn - Imports the module whose default export is the component.
 * @returns A component that renders `fallback` on the server and while the module loads on the
 * client, then the imported component.
 */
export default function clientOnly<T extends Component<any>>(
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
