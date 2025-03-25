import { createSubscriber } from 'svelte/reactivity'

type VoidFn = () => void
type Subscriber = (update: VoidFn) => void | VoidFn
type Effect =
  | { type: 'pre'; fn: Subscriber }
  | { type: 'regular'; fn: Subscriber }

export class ReactiveValue<T> {
  #fn
  #subscribe

  constructor(
    fn: () => T,
    onSubscribe: Subscriber,
    effects: Array<Effect> = [],
  ) {
    this.#fn = fn
    this.#subscribe = createSubscriber((update) => {
      const cleanup = $effect.root(() => {
        for (const effect of effects) {
          if (effect.type === 'pre') {
            $effect.pre(() => effect.fn(update))
          } else {
            $effect(() => effect.fn(update))
          }
        }
      })
      const off = onSubscribe(update)
      return () => {
        cleanup()
        off?.()
      }
    })
  }

  get current() {
    this.#subscribe()
    return this.#fn()
  }
}

export function createReactiveThunk<T>(
  fn: () => T,
  onSubscribe: Subscriber,
  effects?: Array<Effect>,
) {
  const reactiveValue = new ReactiveValue(fn, onSubscribe, effects)
  return () => reactiveValue.current
}
