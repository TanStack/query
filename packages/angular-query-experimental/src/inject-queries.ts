import { QueriesObserver, notifyManager } from '@tanstack/query-core'
<<<<<<<< HEAD:packages/svelte-query-runes/src/createQueries.svelte.ts
import { flushSync, onDestroy, onMount, untrack } from 'svelte'
import { useIsRestoring } from './useIsRestoring'
import { useQueryClient } from './useQueryClient'
import { createMemo, createResource } from './utils.svelte'
========
import { DestroyRef, computed, effect, inject, signal } from '@angular/core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { injectQueryClient } from './inject-query-client'
import type { Injector, Signal } from '@angular/core'
>>>>>>>> main:packages/angular-query-experimental/src/inject-queries.ts
import type {
  DefaultError,
  OmitKeyof,
  QueriesObserverOptions,
  QueriesPlaceholderDataFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'
import type { FnOrVal } from '.'

// This defines the `CreateQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type QueryObserverOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForUseQueries = symbol

type GetOptions<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? QueryObserverOptionsForCreateQueries<unknown, TError, TData>
        : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
          T extends [infer TQueryFnData, infer TError, infer TData]
          ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
          : T extends [infer TQueryFnData, infer TError]
            ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? QueryObserverOptionsForCreateQueries<TQueryFnData>
              : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
                T extends {
<<<<<<<< HEAD:packages/svelte-query-runes/src/createQueries.svelte.ts
                    queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
                    select?: (data: any) => infer TData
========
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForUseQueries
                    select: (data: any) => infer TData
>>>>>>>> main:packages/angular-query-experimental/src/inject-queries.ts
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? QueryObserverOptionsForCreateQueries<
                    TQueryFnData,
                    unknown extends TError ? DefaultError : TError,
                    unknown extends TData ? TQueryFnData : TData,
                    TQueryKey
                  >
                : // Fallback
                  QueryObserverOptionsForCreateQueries

type GetResults<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? QueryObserverResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? QueryObserverResult<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? QueryObserverResult<TData, TError>
        : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
          T extends [any, infer TError, infer TData]
          ? QueryObserverResult<TData, TError>
          : T extends [infer TQueryFnData, infer TError]
            ? QueryObserverResult<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? QueryObserverResult<TQueryFnData>
              : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
                T extends {
<<<<<<<< HEAD:packages/svelte-query-runes/src/createQueries.svelte.ts
                    queryFn?: QueryFunction<infer TQueryFnData, any>
                    select?: (data: any) => infer TData
========
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForUseQueries
                    select: (data: any) => infer TData
>>>>>>>> main:packages/angular-query-experimental/src/inject-queries.ts
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? QueryObserverResult<
                    unknown extends TData ? TQueryFnData : TData,
                    unknown extends TError ? DefaultError : TError
                  >
                : // Fallback
                  QueryObserverResult

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 * @public
 */
export type QueriesOptions<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverOptionsForCreateQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetOptions<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesOptions<
            [...Tail],
            [...TResult, GetOptions<Head>],
            [...TDepth, 1]
          >
        : ReadonlyArray<unknown> extends T
          ? T
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
            // use this to infer the param types in the case of Array.map() argument
            T extends Array<
                QueryObserverOptionsForCreateQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                QueryObserverOptionsForCreateQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : // Fallback
              Array<QueryObserverOptionsForCreateQueries>

/**
 * QueriesResults reducer recursively maps type param to results
 * @public
 */
export type QueriesResults<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetResults<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesResults<
            [...Tail],
            [...TResult, GetResults<Head>],
            [...TDepth, 1]
          >
        : T extends Array<
              QueryObserverOptionsForCreateQueries<
                infer TQueryFnData,
                infer TError,
                infer TData,
                any
              >
            >
          ? // Dynamic-size (homogenous) CreateQueryOptions array: map directly to array of results
            Array<
              QueryObserverResult<
                unknown extends TData ? TQueryFnData : TData,
                unknown extends TError ? DefaultError : TError
              >
            >
          : // Fallback
            Array<QueryObserverResult>

<<<<<<<< HEAD:packages/svelte-query-runes/src/createQueries.svelte.ts
export function createQueries<
========
/**
 * @public
 */
export function injectQueries<
>>>>>>>> main:packages/angular-query-experimental/src/inject-queries.ts
  T extends Array<any>,
  TCombinedResult extends QueriesResults<T> = QueriesResults<T>,
>(
  {
    queries,
    ...options
  }: {
    queries: FnOrVal<[...QueriesOptions<T>]>
    combine?: (result: QueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): TCombinedResult {
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()

  const queriesStore = $derived(
    typeof queries != 'function' ? () => queries : queries,
  )

<<<<<<<< HEAD:packages/svelte-query-runes/src/createQueries.svelte.ts
  const defaultedQueriesStore = createMemo(() => {
    return queriesStore().map((opts) => {
      const defaultedOptions = client.defaultQueryOptions(opts)
      // Make sure the results are already in fetching state before subscribing or updating options
      defaultedOptions._optimisticResults = isRestoring
        ? 'isRestoring'
        : 'optimistic'
      return defaultedOptions
========
        return defaultedOptions as QueryObserverOptions
      })
>>>>>>>> main:packages/angular-query-experimental/src/inject-queries.ts
    })
  })
  const observer = new QueriesObserver<TCombinedResult>(
    client,
    defaultedQueriesStore(),
    options as QueriesObserverOptions<TCombinedResult>,
  )

  $effect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
<<<<<<<< HEAD:packages/svelte-query-runes/src/createQueries.svelte.ts
    observer.setQueries(
      defaultedQueriesStore(),
      options as QueriesObserverOptions<TCombinedResult>,
      { listeners: false },
    )
========
    effect(() => {
      observer.setQueries(
        defaultedQueries(),
        options as QueriesObserverOptions<TCombinedResult>,
        { listeners: false },
      )
    })

    const [, getCombinedResult] = observer.getOptimisticResult(
      defaultedQueries(),
      (options as QueriesObserverOptions<TCombinedResult>).combine,
    )

    const result = signal(getCombinedResult() as any)

    const unsubscribe = observer.subscribe(notifyManager.batchCalls(result.set))
    destroyRef.onDestroy(unsubscribe)

    return result
>>>>>>>> main:packages/angular-query-experimental/src/inject-queries.ts
  })

  let result = $state<TCombinedResult>(
    observer.getOptimisticResult(defaultedQueriesStore())[1](),
  )

  /*   $effect.pre(() => {
    const unsubscribe = isRestoring
      ? () => undefined
      : observer.subscribe(
          notifyManager.batchCalls((v) => {
            result = v
          }),
        )

    return () => unsubscribe()
  }) */

  //
  $effect(() => {
    if (queries.length) {
      untrack(() => {
        result = observer.getOptimisticResult(defaultedQueriesStore())[1]()
      })
    }
  })
  const dataResources = $derived(
    result.map((queryRes) => {
      const dataPromise = () =>
        new Promise((resolve) => {
          if (queryRes.isFetching && queryRes.isLoading) return
          resolve($state.snapshot(queryRes.data))
        })
      return createResource(dataPromise)
    }),
  )
  flushSync(() => {
    for (let index = 0; index < dataResources.length; index++) {
      const dataResource = dataResources[index]!
      dataResource[1].mutate(() => $state.snapshot(result[index]!.data))
      dataResource[1].refetch()
    }
  })
  let taskQueue: Array<() => void> = []

  const subscribeToObserver = () =>
    observer.subscribe((result_) => {
      taskQueue.push(() => {
        flushSync(() => {
          const dataResources_ = dataResources
          for (let index = 0; index < dataResources_.length; index++) {
            const dataResource = dataResources_[index]!
            const unwrappedResult = { ...$state.snapshot(result_[index]!) }

            result[index] = $state.snapshot(unwrappedResult)
            dataResource[1].mutate(() => $state.snapshot(result_[index]!.data))
            dataResource[1].refetch()
          }
        })
      })

      queueMicrotask(() => {
        const taskToRun = taskQueue.pop()
        if (taskToRun) taskToRun()
        taskQueue = []
      })
    })
  let unsubscribe: () => void = () => undefined
  $effect.pre(() => {
    unsubscribe = isRestoring ? () => undefined : subscribeToObserver()
    // cleanup needs to be scheduled after synchronous effects take place
    return () => queueMicrotask(unsubscribe)
  })
  onDestroy(unsubscribe)
  onMount(() => {
    observer.setQueries(defaultedQueriesStore(), undefined, {
      listeners: false,
    })
  })
  const handler = (index: number) => ({
    get(target: QueryObserverResult, prop: keyof QueryObserverResult): any {
      if (prop === 'data') {
        return dataResources[index]![0]()
      }
      return Reflect.get(target, prop)
    },
  })

  const getProxies = $derived(() =>
    result.map((s, index) => {
      return new Proxy(s, handler(index))
    }),
  )
  const proxifiedState = $state(getProxies())

  /*  $effect(() => {
    console.log(
      'result updated',
      result,
      JSON.stringify(result),
      JSON.stringify(proxifiedState),
    )
  }) 
  $effect(() => {
    console.log(
      'proxifiedState',

      JSON.stringify(proxifiedState),
    )
  })*/
  $effect.pre(() => {
    untrack(() => {
      Object.assign(proxifiedState, getProxies())
    })
  })
  return proxifiedState as TCombinedResult
}
7
