import { computed, type Signal } from '@angular/core'
import type { DefaultError, QueryObserverResult } from '@tanstack/query-core'
import { CreateBaseQueryResult } from './types'

export function createResultStateSignalProxy<
  TData = unknown,
  TError = DefaultError,
  State = QueryObserverResult<TData, TError>,
>(resultState: Signal<State>) {
  const internalState = {} as CreateBaseQueryResult<TData, TError, State>

  return new Proxy(internalState, {
    get<Key extends keyof State>(
      target: CreateBaseQueryResult<TData, TError, State>,
      prop: Key | string | symbol,
    ) {
      // first check if we have it in our internal state and return it
      const computedField = target[prop as Key]
      if (computedField) return computedField

      // then, check if it's a function on the resultState and return it
      const targetField = untracked(resultState)[prop as Key]
      if (typeof targetField === 'function') return targetField

      // finally, create a computed field, store it and return it
      const newComputed = computed(() => resultState()[prop as Key])
      // @ts-ignore
      target[prop] = newComputed
      return newComputed
    },
    has<K extends keyof State>(
      target: CreateBaseQueryResult<TData, TError, State>,
      prop: K | string | symbol,
    ) {
      return !!target[prop as K]
    },
    ownKeys(target) {
      return [...Reflect.ownKeys(target)]
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true,
      }
    },
    set(): boolean {
      return true
    },
  })
}
