import {
  createComponent,
  createSignal,
  onMount,
  sharedConfig,
  splitProps,
  untrack,
} from 'solid-js'
import { isServer } from 'solid-js/web'
import type { Component, ComponentProps, JSX } from 'solid-js'

export default function clientOnly<T extends Component<any>>(
  fn: () => Promise<{
    default: T
  }>,
) {
  if (isServer) {
    return (props: ComponentProps<T> & { fallback?: JSX.Element }) =>
      props.fallback
  }

  const [comp, setComp] = createSignal<T>()
  fn().then((m) => setComp(() => m.default))

  return (props: ComponentProps<T> & { fallback?: JSX.Element }) => {
    let Comp: T | undefined
    const [, rest] = splitProps(props, ['fallback'])

    if ((Comp = comp()) && !sharedConfig.context) {
      return createComponent(Comp, rest)
    }

    const [mounted, setMounted] = createSignal(!sharedConfig.context)
    onMount(() => setMounted(true))

    return untrack(() => {
      const C = comp()
      const m = mounted()
      return C && m ? createComponent(C, rest) : props.fallback
    })
  }
}