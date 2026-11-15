import {
  createMemo,
  createSignal,
  isHydrating,
  omit,
  onSettled,
  untrack,
} from 'solid-js'
import { isServer } from '@solidjs/web'
import type { Component, ComponentProps } from 'solid-js'
import type { JSX } from '@solidjs/web'

/**
 * Loads the devtools only on the client, so that they bypass any server side rendering. Taken from
 * [solid-start's codebase](https://github.com/solidjs/solid-start/blob/2967fc2db3f0df826f061020231dbdafdfa0746b/packages/start/islands/clientOnly.tsx).
 * @param fn - Dynamically imports the module whose default export is the component.
 * @returns A component that renders `props.fallback` on the server and until the import resolves.
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
    const rest = omit(props, 'fallback')
    if ((Comp = comp()) && !isHydrating()) return Comp(rest)
    const [mounted, setMounted] = createSignal(!isHydrating())
    onSettled(() => {
      setMounted(true)
    })
    return createMemo(
      () => (
        (Comp = comp()),
        (m = mounted()),
        untrack(() => (Comp && m ? Comp(rest) : props.fallback))
      ),
    )
  }
}
