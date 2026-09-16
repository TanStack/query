import { QueriesObserver, QueryClient } from '@tanstack/query-core'
import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core'
import { injectQueryZone } from './utils/inject-query-zone'
import { signalProxy } from './utils/signal-proxy'
import { queryResultFields } from './utils/result-fields'
import { injectIsRestoring } from './inject-is-restoring'
import { injectPendingTasksLifecycle } from './utils/inject-pending-tasks-lifecycle'
import { injectExternalStore } from './utils/inject-external-store'
import type {
  InjectQueriesOptions,
  QueriesResults,
} from './inject-queries.types'
import type {
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Signal } from '@angular/core'

/**
 * Injects multiple queries that run in parallel and react to Angular signals.
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/parallel-queries
 * @param optionsFn - A function that returns the queries' options. Similar to `computed` from Angular,
 * this function runs in the reactive context, so signals read inside it drive the queries.
 * @returns A signal containing the query results in the same order as the input queries.
 *
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'users',
 *   template: `
 *     @for (query of userQueries(); track $index) {
 *       @if (query.isSuccess()) {
 *         <p>{{ query.data().name }}</p>
 *       }
 *     }
 *   `,
 * })
 * export class UsersComponent {
 *   readonly users = input.required<Array<User>>()
 *
 *   readonly userQueries = injectQueries(() => ({
 *     queries: this.users().map((user) => ({
 *       queryKey: ['user', user.id],
 *       queryFn: () => fetchUserById(user.id),
 *     })),
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

      return defaultedOptions as QueryObserverOptions
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
  }) as unknown as Signal<TCombinedResult>
}
