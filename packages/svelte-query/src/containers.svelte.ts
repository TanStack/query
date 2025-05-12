import { createSubscriber } from 'svelte/reactivity'

type VoidFn = () => void
type Subscriber = (update: VoidFn) => void | VoidFn

export type Box<T> = { current: T }

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

/**
 * Makes all of the top-level keys of an object into $state.raw fields whose initial values
 * are the same as in the original object. Does not mutate the original object. Provides an `update`
 * function that _can_ (but does not have to be) be used to replace all of the object's top-level keys
 * with the values of the new object, while maintaining the original root object's reference.
 */
export function createRawRef<T extends {} | Array<unknown>>(
  init: T,
): [T, (newValue: T) => void] {
  const refObj = (Array.isArray(init) ? [] : {}) as T
  const hiddenKeys = new Set<PropertyKey>()
  const out = new Proxy(refObj, {
    set(target, prop, value, receiver) {
      hiddenKeys.delete(prop)
      if (prop in target) {
        return Reflect.set(target, prop, value, receiver)
      }
      let state = $state.raw(value)
      Object.defineProperty(target, prop, {
        configurable: true,
        enumerable: true,
        get: () => {
          // If this is a lazy value, we need to call it.
          // We can't do something like typeof state === 'function'
          // because the value could actually be a function that we don't want to call.
          return state && isBranded(state) ? state() : state
        },
        set: (v) => {
          state = v
        },
      })
      return true
    },
    has: (target, prop) => {
      if (hiddenKeys.has(prop)) {
        return false
      }
      return prop in target
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter((key) => !hiddenKeys.has(key))
    },
    getOwnPropertyDescriptor(target, prop) {
      if (hiddenKeys.has(prop)) {
        return undefined
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
    deleteProperty(target, prop) {
      if (prop in target) {
        // @ts-expect-error
        // We need to set the value to undefined to signal to the listeners that the value has changed.
        // If we just deleted it, the reactivity system wouldn't have any idea that the value was gone.
        target[prop] = undefined
        hiddenKeys.add(prop)
        if (Array.isArray(target)) {
          target.length--
        }
        return true
      }
      return false
    },
  })

  function update(newValue: T) {
    const existingKeys = Object.keys(out)
    const newKeys = Object.keys(newValue)
    const keysToRemove = existingKeys.filter((key) => !newKeys.includes(key))
    for (const key of keysToRemove) {
      // @ts-expect-error
      delete out[key]
    }
    for (const key of newKeys) {
      // @ts-expect-error
      // This craziness is required because Tanstack Query defines getters for all of the keys on the object.
      // These getters track property access, so if we access all of them here, we'll end up tracking everything.
      // So we wrap the property access in a special function that we can identify later to lazily access the value.
      // (See above)
      out[key] = brand(() => newValue[key])
    }
  }

  // we can't pass `init` directly into the proxy because it'll never set the state fields
  // (because (prop in target) will always be true)
  update(init)

  return [out, update]
}

const lazyBrand = Symbol('LazyValue')
type Branded<T extends () => unknown> = T & { [lazyBrand]: true }

function brand<T extends () => unknown>(fn: T): Branded<T> {
  // @ts-expect-error
  fn[lazyBrand] = true
  return fn as Branded<T>
}

function isBranded<T extends () => unknown>(fn: T): fn is Branded<T> {
  return Boolean((fn as Branded<T>)[lazyBrand])
}
