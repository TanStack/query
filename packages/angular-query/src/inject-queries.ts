import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core'
import { QueriesObserver, QueryClient } from '@tanstack/query-core'
import { injectIsRestoring } from './inject-is-restoring'
import { injectExternalStore } from './utils/inject-external-store'
import { injectPendingTasksLifecycle } from './utils/inject-pending-tasks-lifecycle'
import { injectQueryZone } from './utils/inject-query-zone'
import { queryResultFields } from './utils/result-fields'
import { signalProxy } from './utils/signal-proxy'
import type { Signal } from '@angular/core'
import type {
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type {
  InjectQueriesOptions,
  QueriesResults,
} from './inject-queries.types'

/**
 * Injects a signal to fetch a variable number of queries.
 *
 * The `queries` key accepts an array with query option objects mostly identical to `injectQuery`'s. Having
 * the same query key more than once in the array of query objects may cause some data to be shared between
 * queries. To avoid this, consider de-duplicating the queries and map the results back to the desired
 * structure.
 *
 * The `combine` option can be used to combine the results of the queries into a single value. The result
 * will be structurally shared to be as referentially stable as possible.
 * @param optionsFn - A function returning the queries' options — an array of query option objects under
 * `queries`, and an optional `combine`. Similar to `computed` from Angular, this function runs in the
 * reactive context, so signals read inside it (e.g. to build the `queries` array) drive the queries.
 * @returns A `Signal` with the combined result. Without `combine`, this is an array with all the query
 * results, in the same order as the input. When `combine` is provided, this is the value returned by
 * `combine` instead.
 * @remarks Unlike `injectQuery`, `injectQueries` cannot infer the `data` argument of an _inline_ `select`
 * from its sibling `queryFn`. Because `injectQueries` infers the type of the whole `queries` array at once,
 * the `select` parameter of a query object written inline cannot be contextually typed from that same
 * object's `queryFn`, so it falls back to `unknown` — a
 * [known TypeScript limitation](https://github.com/TanStack/query/issues/6556). Annotate the `select`
 * parameter explicitly, or define the query with {@link queryOptions}, which resolves its types in a single
 * object _before_ it reaches `injectQueries`, to work around this — see the example below.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/parallel-queries
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     <ul>
 *       @for (query of postQueries(); track $index) {
 *         @if (query.isPending()) {
 *           <li>Loading...</li>
 *         } @else if (query.isError()) {
 *           <li>Error: {{ query.error()?.message }}</li>
 *         } @else {
 *           <li>{{ query.data().title }}</li>
 *         }
 *       }
 *     </ul>
 *   `,
 * })
 * export class Posts {
 *   readonly ids = signal([1, 2, 3])
 *
 *   readonly postQueries = injectQueries(() => ({
 *     queries: this.ids().map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *       staleTime: Infinity,
 *     })),
 *   }))
 * }
 * ```
 * @example
 * Combining results into a single value:
 * ```angular-ts
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     @if (combined().isPending) {
 *       Loading...
 *     } @else if (combined().isError) {
 *       Error loading posts
 *     } @else {
 *       <ul>
 *         @for (post of combined().data; track post?.id) {
 *           <li>{{ post?.title }}</li>
 *         }
 *       </ul>
 *     }
 *   `,
 * })
 * export class Posts {
 *   readonly ids = signal([1, 2, 3])
 *
 *   readonly combined = injectQueries(() => ({
 *     queries: this.ids().map((id) => ({
 *       queryKey: ['post', id],
 *       queryFn: () => fetchPost(id),
 *     })),
 *     combine: (postQueries) => ({
 *       data: postQueries.map((query) => query.data),
 *       isPending: postQueries.some((query) => query.isPending),
 *       isError: postQueries.some((query) => query.isError),
 *     }),
 *   }))
 * }
 * ```
 * @example
 * Typing `select` via {@link queryOptions}. Note that spreading a `queryOptions` result and overriding
 * `select` inline still falls back to `unknown` — wrap the spread in `queryOptions` again so the override is
 * resolved before it reaches `injectQueries`:
 * ```angular-ts
 * const postOptions = (id: number) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * @Component({
 *   selector: 'post-title',
 *   template: `<h1>{{ fixed()[0].data() }}</h1>`,
 * })
 * export class PostTitle {
 *   readonly id = signal(1)
 *
 *   readonly broken = injectQueries(() => ({
 *     queries: [
 *       {
 *         ...postOptions(this.id()),
 *         // ❌ `data` is `unknown` here
 *         select: (data) => data.title,
 *       },
 *     ],
 *   }))
 *
 *   readonly fixed = injectQueries(() => ({
 *     queries: [
 *       queryOptions({
 *         ...postOptions(this.id()),
 *         // ✅ `data` is `Post`
 *         select: (data) => data.title,
 *       }),
 *     ],
 *   }))
 * }
 * ```
 */
export function injectQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  optionsFn: () => InjectQueriesOptions<T, TCombinedResult>,
): Signal<TCombinedResult> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectQueries)
  }
  const outsideZone = injectQueryZone()
  const queryClient = inject(QueryClient)
  const isRestoring = injectIsRestoring()
  const lifecycle = injectPendingTasksLifecycle()

  const optionsSignal = computed(optionsFn)

  const defaultedQueries = computed(() => {
    return optionsSignal().queries.map((opts) => {
      const defaultedOptions = queryClient.defaultQueryOptions(
        opts as QueryObserverOptions,
      )
      defaultedOptions._optimisticResults = isRestoring()
        ? 'isRestoring'
        : 'optimistic'
      defaultedOptions.notifyOnChangeProps = 'all'

      return defaultedOptions
    })
  })

  const shouldBlockPendingTasks = (
    observer: QueriesObserver<TCombinedResult>,
    results: Array<QueryObserverResult>,
  ) => {
    const queries = observer.getQueries()

    return results.some((result, index) => {
      return (
        queries[index]?.state.fetchStatus !== 'idle' ||
        (result.fetchStatus !== 'idle' && result.isEnabled)
      )
    })
  }

  const observerSignal = computed(
    () =>
      new QueriesObserver<TCombinedResult>(
        queryClient,
        untracked(defaultedQueries),
      ),
  )

  effect(() => {
    const queries = defaultedQueries()
    outsideZone(() => untracked(() => observerSignal().setQueries(queries)))
  })

  // Methods address the current array slot, including methods handed to combine.
  const refetches: Array<QueryObserverResult['refetch']> = []
  const getRefetch = (index: number): QueryObserverResult['refetch'] =>
    (refetches[index] ??= (options) =>
      outsideZone(() =>
        untracked(() => {
          const observer = observerSignal()
          observer.setQueries(defaultedQueries())
          const queryObserver = observer.getObservers()[index]
          if (!queryObserver) {
            return Promise.reject(
              new Error(`Cannot refetch removed query at index ${index}`),
            )
          }
          return queryObserver.refetch(options)
        }),
      ))

  const resultSignal = injectExternalStore(() => {
    const observer = observerSignal()
    const restoring = isRestoring()
    return {
      getSnapshot: () => {
        const results = observer.getOptimisticResult(
          defaultedQueries(),
          undefined,
        )[0]
        refetches.length = results.length
        return results.map((result, index) => ({
          ...result,
          refetch: getRefetch(index),
        }))
      },
      subscribe: restoring
        ? undefined
        : (onStoreChange) => {
            const unsubscribe = observer.subscribe(() => {
              if (lifecycle.destroyed) return
              onStoreChange()
            })
            return () => {
              lifecycle.setPending(false)
              unsubscribe()
            }
          },
    }
  })

  effect((onCleanup) => {
    const results = resultSignal()
    if (isRestoring()) {
      lifecycle.setPending(false)
      return
    }

    lifecycle.setPending(shouldBlockPendingTasks(observerSignal(), results))
    onCleanup(() => lifecycle.setPending(false))
  })

  const createResultProxy = (index: number) => {
    const resultAtIndexSignal = computed(() => resultSignal()[index]!)
    return Object.assign(signalProxy(resultAtIndexSignal, queryResultFields), {
      refetch: getRefetch(index),
    })
  }

  const resultProxies: Array<ReturnType<typeof createResultProxy>> = []
  const proxiedResultsSignal = computed(() => {
    const results = resultSignal()
    resultProxies.length = results.length

    return results.map((_, index) => {
      return (resultProxies[index] ??= createResultProxy(index))
    })
  })

  // Combine in Angular's tracked computation. Core must notify for every raw
  // result change, including changes a previous combine function ignored.
  return computed(() => {
    const result = resultSignal()
    const { combine } = optionsSignal()

    if (combine)
      return combine(result as Parameters<NonNullable<typeof combine>>[0])

    return proxiedResultsSignal() as unknown as TCombinedResult
  })
}
