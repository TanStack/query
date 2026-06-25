import {
  createMemo,
  createSignal,
  omit,
  onSettled,
  sharedConfig,
  untrack,
} from 'solid-js'
import { isServer } from '@solidjs/web'
import type { Component, ComponentProps } from 'solid-js'
import type { JSX } from '@solidjs/web'

/*
  This function has been taken from solid-start's codebase
  This allows the devtools to be loaded only on the client and bypasses any server side rendering
  https://github.com/solidjs/solid-start/blob/2967fc2db3f0df826f061020231dbdafdfa0746b/packages/start/islands/clientOnly.tsx
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
    if ((Comp = comp()) && !sharedConfig.hydrating) return Comp(rest)
    const [mounted, setMounted] = createSignal(!sharedConfig.hydrating)
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
