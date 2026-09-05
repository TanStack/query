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

/** A plain value or a reactive getter (`() => T`) that returns one. */
export type MaybeGetter<T> = T | (() => T)

/**
 * A plain value, a `Ref`, or a `ComputedRef`. Accepting this instead of a bare `T` lets a composable take
 * either a reactive or a static value for a given option — see the [Reactivity guide](../../reactivity.md).
 */
export type MaybeRef<T> = Ref<T> | ComputedRef<T> | T

/**
 * A {@link MaybeRef}, or a reactive getter (`() => T`). Reactive getters are a lighter-weight alternative to
 * `computed` for deriving a value from other reactive state — see the
 * [Reactivity guide](../../reactivity.md#using-derived-state-inside-queries).
 */
export type MaybeRefOrGetter<T> = MaybeRef<T> | (() => T)

/**
 * Like {@link MaybeRef}, but applied recursively to every property of `T` — so each field of an options object
 * (for example, an entry inside a `queryKey` array) can independently be a plain value or a `ref`, not just the
 * object as a whole.
 */
export type MaybeRefDeep<T> = MaybeRef<
  T extends Function
    ? T
    : T extends object
      ? {
          [Property in keyof T]: MaybeRefDeep<T[Property]>
        }
      : T
>

/** @internal Rejects `unknown`, collapsing it to `never` — used to keep generic inference from silently widening. */
export type NoUnknown<T> = Equal<unknown, T> extends true ? never : T

/** @internal Type-level equality check between `TTargetA` and `TTargetB`. */
export type Equal<TTargetA, TTargetB> =
  (<T>() => T extends TTargetA ? 1 : 2) extends <T>() => T extends TTargetB
    ? 1
    : 2
    ? true
    : false

/** The inverse of {@link MaybeRefDeep} — recursively unwraps any `Ref`s in `T` back to their plain value types. */
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

export type MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
> &
  ShallowOption

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
