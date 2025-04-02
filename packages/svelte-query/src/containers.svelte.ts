import { tick, untrack } from 'svelte'
import { createSubscriber } from 'svelte/reactivity'

type VoidFn = () => void
type Subscriber = (update: VoidFn) => void | VoidFn

export class ReactiveValue<T> implements Box<T> {
  #fn
  #subscribe

  constructor(fn: () => T, onSubscribe: Subscriber) {
    this.#fn = fn
    this.#subscribe = createSubscriber((update) => onSubscribe(update))
  }

  get current() {
    this.#subscribe()
    return this.#fn()
  }
}

export type Box<T> = { current: T }

export function box<T>(value: T): Box<T> {
  let current = $state(value)
  return {
    get current() {
      return current
    },
    set current(newValue) {
      current = newValue
    },
  }
}

/**
 * Makes all of the top-level keys of an object into $state.raw fields whose initial values
 * are the same as in the original object. Does not mutate the original object. Provides an `update`
 * function that _can_ (but does not have to be) be used to replace all of the object's top-level keys
 * with the values of the new object, while maintaining the original root object's reference.
 */
export function createRawRef<T extends {} | Array<unknown>>(
  init: T,
): [T, (newValue: T) => void] {
  const out = (Array.isArray(init) ? [] : {}) as T

  function update(newValue: T) {
    Object.assign(out, newValue)
  }

  for (const [key, value] of Object.entries(init)) {
    let state = $state.raw(value)
    Object.defineProperty(out, key, {
      enumerable: true,
      get: () => state,
      set: (v) => {
        state = v
      },
    })
  }
  return [out, update]
}
