import { createSubscriber } from 'svelte/reactivity'

type VoidFn = () => void
type Subscriber = (update: VoidFn) => void | VoidFn

export class ReactiveValue<T> {
  #fn
  #subscribe

  constructor(fn: () => T, onSubscribe: Subscriber) {
    this.#fn = fn
    this.#subscribe = createSubscriber(onSubscribe)
  }

  get current() {
    this.#subscribe()
    return this.#fn()
  }
}

export function createReactiveThunk<T>(fn: () => T, onSubscribe: Subscriber) {
  const reactiveValue = new ReactiveValue(fn, onSubscribe)
  return () => reactiveValue.current
}
