import { SvelteSet, createSubscriber } from 'svelte/reactivity'

type VoidFn = () => void
type Subscriber = (update: VoidFn) => void | VoidFn

/**
 * An object holding a value in its `current` property, e.g. a reactive value backed by `$state`.
 */
export type Box<T> = {
  /**
   * The held value.
   */
  current: T
}

/**
 * A {@link Box} whose `current` value is computed on each read, and that notifies the reactive
 * contexts reading it through the given subscriber.
 */
export class ReactiveValue<T> implements Box<T> {
  #fn
  #subscribe

  constructor(fn: () => T, onSubscribe: Subscriber) {
    this.#fn = fn
    this.#subscribe = createSubscriber((update) => onSubscribe(update))
  }

  /**
   * Subscribes the reactive context reading it, then computes the value.
   * @returns The value returned by the compute function.
   */
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
 * @param init - The object or array whose top-level keys become the initial fields.
 * @returns A tuple of the reactive object and the `update` function.
 */
export function createRawRef<T extends {} | Array<unknown>>(
  init: T,
): [T, (newValue: T) => void] {
  const refObj = (Array.isArray(init) ? [] : {}) as T
  const hiddenKeys = new SvelteSet<PropertyKey>()
  // Absent keys have no `$state.raw` field to subscribe to, and `length` is a
  // plain array property, so reads of either are tracked through this instead.
  // Without it, anything observed while the ref is empty never re-runs.
  let keyVersion = $state.raw(0)
  const trackKeys = () => keyVersion
  const out = new Proxy(refObj, {
    get(target, prop, receiver) {
      if (
        hiddenKeys.has(prop) ||
        !(prop in target) ||
        (Array.isArray(target) && prop === 'length')
      ) {
        trackKeys()
      }
      return Reflect.get(target, prop, receiver)
    },
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

  /**
   * Replaces the top-level keys of the reactive object with those of `newValue`, removing keys that
   * `newValue` doesn't have, while keeping the object's reference.
   * @param newValue - The object or array to take the new keys and values from.
   */
  function update(newValue: T) {
    const existingKeys = Object.keys(out)
    const newKeys = Object.keys(newValue)
    const keysToRemove = existingKeys.filter((key) => !newKeys.includes(key))
    // Arrays: delete in descending index order so each `deleteProperty` trap
    // sees the slot it is removing as the current tail (length-- stays valid).
    // Forward iteration would shrink the array under our feet and the next
    // index would no longer be `in target`, tripping the trap.
    if (Array.isArray(newValue)) {
      keysToRemove.sort((a, b) => Number(b) - Number(a))
    }
    const keysAdded = newKeys.some((key) => !existingKeys.includes(key))
    for (const key of keysToRemove) {
      // @ts-expect-error
      delete out[key]
    }
    for (const key of newKeys) {
      // @ts-expect-error
      // This craziness is required because TanStack Query defines getters for all of the keys on the object.
      // These getters track property access, so if we access all of them here, we'll end up tracking everything.
      // So we wrap the property access in a special function that we can identify later to lazily access the value.
      // (See above)
      out[key] = brand(() => newValue[key])
    }
    if (keysAdded || keysToRemove.length > 0) {
      keyVersion++
    }
  }

  // we can't pass `init` directly into the proxy because it'll never set the state fields
  // (because (prop in target) will always be true)
  update(init)

  return [out, update]
}

const lazyBrand = Symbol('LazyValue')
type Branded<T extends () => unknown> = T & { [lazyBrand]: true }

/**
 * Marks a function as a lazy value, so that reading the property it is stored in calls it instead of
 * returning the function.
 * @param fn - The function that returns the value.
 * @returns The same function, marked as lazy.
 */
function brand<T extends () => unknown>(fn: T): Branded<T> {
  // @ts-expect-error
  fn[lazyBrand] = true
  return fn as Branded<T>
}

/**
 * Checks whether a function was marked as a lazy value with {@link brand}.
 * @param fn - The function to check.
 * @returns `true` if the function is marked as lazy.
 */
function isBranded<T extends () => unknown>(fn: T): fn is Branded<T> {
  return Boolean((fn as Branded<T>)[lazyBrand])
}
