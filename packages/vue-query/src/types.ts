import type {
  DefaultError,
  DehydrateOptions,
  HydrateOptions,
  MutationCache,
  MutationObserverOptions,
  OmitKeyof,
  QueryCache,
  QueryObserverOptions,
} from '@tanstack/query-core'
import type { ComputedRef, Ref, UnwrapRef } from 'vue-demi'

type Primitive = string | number | boolean | bigint | symbol | undefined | null
type UnwrapLeaf =
  | Primitive
  | Function
  | Date
  | Error
  | RegExp
  | Map<any, any>
  | WeakMap<any, any>
  | Set<any>
  | WeakSet<any>

export type MaybeRef<T> = Ref<T> | ComputedRef<T> | T

export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)

export type MaybeRefDeep<T> = MaybeRef<
  T extends Function
    ? T
    : T extends object
      ? {
          [Property in keyof T]: MaybeRefDeep<T[Property]>
        }
      : T
>

export type NoUnknown<T> = Equal<unknown, T> extends true ? never : T

export type Equal<TTargetA, TTargetB> =
  (<T>() => T extends TTargetA ? 1 : 2) extends <T>() => T extends TTargetB
    ? 1
    : 2
    ? true
    : false

export type DeepUnwrapRef<T> = T extends UnwrapLeaf
  ? T
  : T extends Ref<infer U>
    ? DeepUnwrapRef<U>
    : T extends {}
      ? {
          [Property in keyof T]: DeepUnwrapRef<T[Property]>
        }
      : UnwrapRef<T>

export type ShallowOption = {
  /**
   * Return data in a shallow ref object (it is `false` by default). It can be set to `true` to return data in a shallow ref object, which can improve performance if your data does not need to be deeply reactive.
   */
  shallow?: boolean
}

export interface DefaultOptions<TError = DefaultError> {
  queries?: OmitKeyof<QueryObserverOptions<unknown, TError>, 'queryKey'> &
    ShallowOption
  mutations?: MutationObserverOptions<unknown, TError, unknown, unknown> &
    ShallowOption
  hydrate?: HydrateOptions['defaultOptions']
  dehydrate?: DehydrateOptions
}

export interface QueryClientConfig {
  queryCache?: QueryCache
  mutationCache?: MutationCache
  defaultOptions?: DefaultOptions
}
