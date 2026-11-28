import { createKey } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import {
  QueriesObserver,
  QueryClient,
  clearQueryClient,
  defaultQueryFn,
  mountQueryClient,
  select as selectResult,
} from '..'
import type { Query, QueryObserver, QueryObserverResult } from '..'
import type { QueriesObserverOptions } from '../queriesObserver'
import type { ObserverOptionsInput } from '../queryObserver'

describe('queriesObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    mountQueryClient(queryClient)
  })

  afterEach(() => {
    clearQueryClient(queryClient)
  })

  describe('QueriesObserver', () => {
    it('should only expose its documented members', () => {
      expectTypeOf<keyof QueriesObserver>().toEqualTypeOf<
        | 'subscribe'
        | 'hasListeners'
        | 'destroy'
        | 'setQueries'
        | 'getCurrentResult'
        | 'getObservers'
        | 'createResultReader'
      >()
    })
  })

  describe('QueriesObserverOptions', () => {
    it('should keep every option writable', () => {
      type Options = QueriesObserverOptions<number>

      expectTypeOf<Options>().toEqualTypeOf<{
        -readonly [K in keyof Options]: Options[K]
      }>()
    })

    it('should default its type parameter to the array of results', () => {
      expectTypeOf<QueriesObserverOptions>().toEqualTypeOf<
        QueriesObserverOptions<Array<QueryObserverResult>>
      >()
    })

    describe('combine', () => {
      it('should be optional', () => {
        expectTypeOf<QueriesObserverOptions<number>>().toEqualTypeOf<{
          combine?: (result: Array<QueryObserverResult>) => number
        }>()
      })

      it('should take the array of results and return the combined result', () => {
        expectTypeOf<
          NonNullable<QueriesObserverOptions<number>['combine']>
        >().toEqualTypeOf<(result: Array<QueryObserverResult>) => number>()
      })
    })
  })

  describe('constructor', () => {
    it('should default the combined result to the array of results', () => {
      const observer = new QueriesObserver(queryClient, [
        { queryKey: createKey(), queryFn: () => Promise.resolve(1) },
      ])

      expectTypeOf(observer).toEqualTypeOf<
        QueriesObserver<Array<QueryObserverResult>>
      >()
    })

    it('should infer the combined result from combine', () => {
      const observer = new QueriesObserver(
        queryClient,
        [{ queryKey: createKey(), queryFn: () => Promise.resolve(1) }],
        { combine: (results) => results.length },
      )

      expectTypeOf(observer).toEqualTypeOf<QueriesObserver<number>>()
    })

    it('should type the results combine is given', () => {
      new QueriesObserver(queryClient, [], {
        combine: (results) => {
          expectTypeOf(results).toEqualTypeOf<Array<QueryObserverResult>>()
          return results.length
        },
      })
    })

    it('should reject an option it does not declare', () => {
      new QueriesObserver(queryClient, [], {
        // @ts-expect-error combine is the only option
        select: selectResult((results: Array<QueryObserverResult>) => results),
      })

      expectTypeOf<
        keyof QueriesObserverOptions<number>
      >().toEqualTypeOf<'combine'>()
    })

    it('should make the options argument optional', () => {
      expectTypeOf<
        ConstructorParameters<typeof QueriesObserver<number>>['length']
      >().toEqualTypeOf<2 | 3>()
    })

    it('should take the query client as its first argument', () => {
      expectTypeOf<
        ConstructorParameters<typeof QueriesObserver<number>>[0]
      >().toEqualTypeOf<QueryClient>()
    })

    it('should reject an option it does not declare on an observed query', () => {
      new QueriesObserver(queryClient, [
        // @ts-expect-error staleTimes is not a query option
        { queryKey: createKey(), staleTimes: 1000 },
      ])

      const observer = new QueriesObserver(queryClient, [
        { queryFn: defaultQueryFn, queryKey: createKey(), staleTime: 1000 },
      ])

      expectTypeOf(observer).toEqualTypeOf<
        QueriesObserver<Array<QueryObserverResult>>
      >()
    })
  })

  describe('setQueries', () => {
    it('should take an array of query options', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(observer.setQueries)
        .parameter(0)
        .toEqualTypeOf<Array<ObserverOptionsInput>>()
    })

    it('should take the same options as the constructor', () => {
      const observer = new QueriesObserver(queryClient, [], {
        combine: (results) => results.length,
      })

      expectTypeOf(observer.setQueries)
        .parameter(1)
        .toEqualTypeOf<QueriesObserverOptions<number> | undefined>()
    })

    it('should make the options argument optional', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf<
        Parameters<typeof observer.setQueries>['length']
      >().toEqualTypeOf<1 | 2>()
    })

    it('should return nothing', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(observer.setQueries).returns.toEqualTypeOf<void>()
    })
  })

  describe('getCurrentResult', () => {
    it('should return the array of results rather than the combined result', () => {
      const observer = new QueriesObserver(queryClient, [], {
        combine: (results) => results.length,
      })

      expectTypeOf(observer.getCurrentResult()).toEqualTypeOf<
        Array<QueryObserverResult>
      >()
    })

    it('should take no arguments', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf<
        Parameters<typeof observer.getCurrentResult>
      >().toEqualTypeOf<[]>()
    })
  })

  describe('observed queries', () => {
    it('should return the observed queries', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(
        observer.getObservers().map((item) => item.getCurrentQuery()),
      ).toEqualTypeOf<Array<Query>>()
    })
  })

  describe('getObservers', () => {
    it('should return the underlying observers', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(observer.getObservers()).toEqualTypeOf<
        Array<QueryObserver>
      >()
    })
  })

  describe('subscribe', () => {
    it('should take a listener receiving the array of results', () => {
      const observer = new QueriesObserver(queryClient, [], {
        combine: (results) => results.length,
      })

      expectTypeOf(observer.subscribe)
        .parameter(0)
        .parameter(0)
        .toEqualTypeOf<Array<QueryObserverResult>>()
    })

    it('should take a listener returning nothing', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(observer.subscribe)
        .parameter(0)
        .returns.toEqualTypeOf<void>()
    })

    it('should return a function that unsubscribes', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(observer.subscribe).returns.toEqualTypeOf<() => void>()
    })
  })

  describe('hasListeners', () => {
    it('should return whether the observer is subscribed to', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(observer.hasListeners()).toEqualTypeOf<boolean>()
    })
  })

  describe('destroy', () => {
    it('should return nothing', () => {
      const observer = new QueriesObserver(queryClient, [])

      expectTypeOf(observer.destroy()).toEqualTypeOf<void>()
    })
  })
})
