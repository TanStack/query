import type { MutationObserverOf, MutationOf, RuntimeBinding } from './binding'
import type { MutationAction } from './mutation'
import type {
  CacheKeyConfig,
  DefaultError,
  MutationFunctionContext,
  MutationKey,
  NotifyEvent,
} from './types'

/**
 * Global callbacks that fire for every mutation handled by a `MutationCache`, regardless of which
 * component or observer triggered it. They differ from the `defaultOptions` provided to a
 * `QueryClient` in two ways: `defaultOptions` can be overridden by each mutation, while these
 * callbacks are always called, and `onMutate` here does not allow returning a result.
 *
 * If a callback returns a promise, it will be awaited before the mutation continues.
 */
export interface MutationCacheConfig<TRuntime extends RuntimeBinding> {
  /**
   * Configures mutation key comparison and hashing globally.
   * `equalityFn` compares individual values during partial matching and defaults to strict equality.
   * `hashFn` hashes mutation keys for exact matching and mutation defaults.
   */
  mutationKey?: CacheKeyConfig<MutationKey>
  /** Called when any mutation in the cache encounters an error. */
  onError?: (
    error: DefaultError,
    variables: unknown,
    onMutateResult: unknown,
    mutation: MutationOf<TRuntime, unknown, unknown, unknown>,
    context: MutationFunctionContext<TRuntime>,
  ) => Promise<unknown> | unknown
  /** Called when any mutation in the cache is successful. */
  onSuccess?: (
    data: unknown,
    variables: unknown,
    onMutateResult: unknown,
    mutation: MutationOf<TRuntime, unknown, unknown, unknown>,
    context: MutationFunctionContext<TRuntime>,
  ) => Promise<unknown> | unknown
  /** Called before any mutation in the cache executes. */
  onMutate?: (
    variables: unknown,
    mutation: MutationOf<TRuntime, unknown, unknown, unknown>,
    context: MutationFunctionContext<TRuntime>,
  ) => Promise<unknown> | unknown
  /** Called when any mutation in the cache is settled, either successfully or with an error. */
  onSettled?: (
    data: unknown | undefined,
    error: DefaultError | null,
    variables: unknown,
    onMutateResult: unknown,
    mutation: MutationOf<TRuntime, unknown, unknown, unknown>,
    context: MutationFunctionContext<TRuntime>,
  ) => Promise<unknown> | unknown
}

export interface NotifyEventMutationAdded<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'added'
  mutation: MutationOf<TRuntime, any, any, any, any>
}

export interface NotifyEventMutationRemoved<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'removed'
  mutation: MutationOf<TRuntime, any, any, any, any>
}

export interface NotifyEventMutationObserverAdded<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'observerAdded'
  mutation: MutationOf<TRuntime, any, any, any, any>
  observer: MutationObserverOf<TRuntime, any, any, any>
}

export interface NotifyEventMutationObserverRemoved<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'observerRemoved'
  mutation: MutationOf<TRuntime, any, any, any, any>
  observer: MutationObserverOf<TRuntime, any, any, any>
}

export interface NotifyEventMutationObserverOptionsUpdated<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'observerOptionsUpdated'
  mutation?: MutationOf<TRuntime, any, any, any, any>
  observer: MutationObserverOf<TRuntime, any, any, any, any>
}

export interface NotifyEventMutationUpdated<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'updated'
  mutation: MutationOf<TRuntime, any, any, any, any>
  action: MutationAction<any, any, any, any>
}

/**
 * The event passed to a `MutationCache` subscriber. Fired whenever a mutation is added or removed
 * from the cache, its state is updated, or one of its observers is added, removed, or has its
 * options updated.
 */
export type MutationCacheNotifyEvent<TRuntime extends RuntimeBinding> =
  | NotifyEventMutationAdded<TRuntime>
  | NotifyEventMutationRemoved<TRuntime>
  | NotifyEventMutationObserverAdded<TRuntime>
  | NotifyEventMutationObserverRemoved<TRuntime>
  | NotifyEventMutationObserverOptionsUpdated<TRuntime>
  | NotifyEventMutationUpdated<TRuntime>

export type MutationCacheListener<TRuntime extends RuntimeBinding> = (
  event: MutationCacheNotifyEvent<TRuntime>,
) => void
