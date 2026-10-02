import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient } from '..'
import type {
  DefaultError,
  NotifyEvent,
  NotifyEventType,
  Query,
  QueryCacheConfig,
  QueryCacheNotifyEvent,
  QueryFilters,
  QueryKey,
  QueryObserver,
  QueryState,
} from '..'
import type { Action } from '../query'
import type { QueryStore } from '../queryCache'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('queryCache', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
    queryCache = queryClient.getQueryCache()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('QueryCache', () => {
    it('should only expose its documented members', () => {
      expectTypeOf<keyof QueryCache>().toEqualTypeOf<
        | 'subscribe'
        | 'hasListeners'
        | 'config'
        | 'build'
        | 'add'
        | 'remove'
        | 'clear'
        | 'get'
        | 'getAll'
        | 'find'
        | 'findAll'
        | 'notify'
        | 'onFocus'
        | 'onOnline'
      >()
    })
  })

  describe('config', () => {
    it('should be typed as the cache config', () => {
      expectTypeOf(queryCache.config).toEqualTypeOf<QueryCacheConfig>()
      expectTypeOf(new QueryCache().config).toEqualTypeOf<QueryCacheConfig>()
    })

    it('should stay writable', () => {
      type Config = Pick<QueryCache, 'config'>

      expectTypeOf<Config>().toEqualTypeOf<{
        -readonly [K in keyof Config]: Config[K]
      }>()
    })

    it('should be optional when constructing a cache', () => {
      expectTypeOf(QueryCache).constructorParameters.toEqualTypeOf<
        [config?: QueryCacheConfig]
      >()
    })
  })

  describe('QueryCacheConfig', () => {
    it('should declare every callback as optional', () => {
      expectTypeOf<QueryCacheConfig>().toEqualTypeOf<{
        onError?: (
          error: DefaultError,
          query: Query<unknown, unknown, unknown>,
        ) => void
        onSuccess?: (
          data: unknown,
          query: Query<unknown, unknown, unknown>,
        ) => void
        onSettled?: (
          data: unknown | undefined,
          error: DefaultError | null,
          query: Query<unknown, unknown, unknown>,
        ) => void
      }>()
    })

    describe('onError', () => {
      it('should type the error and the query it is given', () => {
        expectTypeOf<
          NonNullable<QueryCacheConfig['onError']>
        >().parameters.toEqualTypeOf<
          [error: DefaultError, query: Query<unknown, unknown, unknown>]
        >()
      })

      it('should not await its return value', () => {
        expectTypeOf<
          NonNullable<QueryCacheConfig['onError']>
        >().returns.toEqualTypeOf<void>()
      })
    })

    describe('onSuccess', () => {
      it('should type the data and the query it is given', () => {
        expectTypeOf<
          NonNullable<QueryCacheConfig['onSuccess']>
        >().parameters.toEqualTypeOf<
          [data: unknown, query: Query<unknown, unknown, unknown>]
        >()
      })

      it('should not await its return value', () => {
        expectTypeOf<
          NonNullable<QueryCacheConfig['onSuccess']>
        >().returns.toEqualTypeOf<void>()
      })
    })

    describe('onSettled', () => {
      it('should type the data, error and query it is given', () => {
        expectTypeOf<
          NonNullable<QueryCacheConfig['onSettled']>
        >().parameters.toEqualTypeOf<
          [
            data: unknown,
            error: DefaultError | null,
            query: Query<unknown, unknown, unknown>,
          ]
        >()
      })

      it('should not await its return value', () => {
        expectTypeOf<
          NonNullable<QueryCacheConfig['onSettled']>
        >().returns.toEqualTypeOf<void>()
      })
    })
  })

  describe('NotifyEventType', () => {
    it('should union exactly the seven event type literals', () => {
      // Every `QueryCacheNotifyEvent` variant redeclares `type` with its own
      // literal, so the base union is only observable through this alias.
      expectTypeOf<NotifyEventType>().toEqualTypeOf<
        | 'added'
        | 'removed'
        | 'updated'
        | 'observerAdded'
        | 'observerRemoved'
        | 'observerResultsUpdated'
        | 'observerOptionsUpdated'
      >()
    })
  })

  describe('NotifyEvent', () => {
    it('should declare a single type property taken from NotifyEventType', () => {
      expectTypeOf<keyof NotifyEvent>().toEqualTypeOf<'type'>()
      expectTypeOf<NotifyEvent['type']>().toEqualTypeOf<NotifyEventType>()
    })
  })

  describe('QueryCacheNotifyEvent', () => {
    it('should union exactly the seven event type literals', () => {
      expectTypeOf<QueryCacheNotifyEvent['type']>().toEqualTypeOf<
        | 'added'
        | 'removed'
        | 'updated'
        | 'observerAdded'
        | 'observerRemoved'
        | 'observerResultsUpdated'
        | 'observerOptionsUpdated'
      >()
    })

    it('should carry an action only on the updated event', () => {
      type Updated = Extract<QueryCacheNotifyEvent, { type: 'updated' }>

      expectTypeOf<keyof Updated>().toEqualTypeOf<'type' | 'query' | 'action'>()
      expectTypeOf<Updated['query']>().toEqualTypeOf<
        Query<any, any, any, any>
      >()
      expectTypeOf<Updated['action']>().toEqualTypeOf<Action<any, any>>()
    })

    it('should declare only a query on the added event', () => {
      expectTypeOf<
        keyof Extract<QueryCacheNotifyEvent, { type: 'added' }>
      >().toEqualTypeOf<'type' | 'query'>()
    })

    it('should declare only a query on the removed event', () => {
      expectTypeOf<
        keyof Extract<QueryCacheNotifyEvent, { type: 'removed' }>
      >().toEqualTypeOf<'type' | 'query'>()
    })

    it('should carry an observer on the observerAdded event', () => {
      expectTypeOf<
        keyof Extract<QueryCacheNotifyEvent, { type: 'observerAdded' }>
      >().toEqualTypeOf<'type' | 'query' | 'observer'>()
      expectTypeOf<
        Extract<QueryCacheNotifyEvent, { type: 'observerAdded' }>['observer']
      >().toEqualTypeOf<QueryObserver<any, any, any, any, any>>()
    })

    it('should carry an observer on the observerRemoved event', () => {
      expectTypeOf<
        keyof Extract<QueryCacheNotifyEvent, { type: 'observerRemoved' }>
      >().toEqualTypeOf<'type' | 'query' | 'observer'>()
      expectTypeOf<
        Extract<QueryCacheNotifyEvent, { type: 'observerRemoved' }>['observer']
      >().toEqualTypeOf<QueryObserver<any, any, any, any, any>>()
    })

    it('should carry an observer on the observerOptionsUpdated event', () => {
      expectTypeOf<
        keyof Extract<QueryCacheNotifyEvent, { type: 'observerOptionsUpdated' }>
      >().toEqualTypeOf<'type' | 'query' | 'observer'>()
      expectTypeOf<
        Extract<
          QueryCacheNotifyEvent,
          { type: 'observerOptionsUpdated' }
        >['observer']
      >().toEqualTypeOf<QueryObserver<any, any, any, any, any>>()
    })

    it('should require the query on every event', () => {
      type EventsWithRequiredQuery = Extract<
        QueryCacheNotifyEvent,
        { query: Query<any, any, any, any> }
      >['type']

      expectTypeOf<EventsWithRequiredQuery>().toEqualTypeOf<
        QueryCacheNotifyEvent['type']
      >()
    })

    it('should not carry an observer on the observerResultsUpdated event', () => {
      expectTypeOf<
        keyof Extract<QueryCacheNotifyEvent, { type: 'observerResultsUpdated' }>
      >().toEqualTypeOf<'type' | 'query'>()
    })
  })

  describe('QueryStore', () => {
    it('should type every method of the store', () => {
      expectTypeOf<QueryStore>().toEqualTypeOf<{
        has: (queryHash: string) => boolean
        set: (queryHash: string, query: Query) => void
        get: (queryHash: string) => Query | undefined
        delete: (queryHash: string) => void
        values: () => IterableIterator<Query>
      }>()
    })
  })

  describe('subscribe', () => {
    it('should type the event given to a listener', () => {
      queryCache.subscribe((event) => {
        expectTypeOf(event).toEqualTypeOf<QueryCacheNotifyEvent>()
      })
    })

    it('should return an unsubscribe function', () => {
      expectTypeOf(queryCache.subscribe(() => {})).toEqualTypeOf<() => void>()
    })
  })

  describe('build', () => {
    it('should carry its type parameters into the query it returns', () => {
      const query = queryCache.build<{ value: string }, CustomError>(
        queryClient,
        {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        },
      )

      expectTypeOf(query).toEqualTypeOf<
        Query<
          { value: string },
          CustomError,
          { value: string },
          ReadonlyArray<unknown>
        >
      >()
      expectTypeOf(query.state).toEqualTypeOf<
        QueryState<{ value: string }, CustomError>
      >()
    })

    it('should preserve a literal queryKey', () => {
      const key = ['a', 1] as const

      expectTypeOf(
        queryCache.build(queryClient, {
          queryKey: key,
          queryFn: () => Promise.resolve('data'),
        }).queryKey,
      ).toEqualTypeOf<readonly ['a', 1]>()
    })

    it('should require a queryKey in the options it is given', () => {
      // @ts-expect-error a queryKey is required
      queryCache.build(queryClient, {
        queryFn: () => Promise.resolve('data'),
      })

      expectTypeOf(queryCache.build)
        .parameter(1)
        .toHaveProperty('queryKey')
        .toEqualTypeOf<ReadonlyArray<unknown>>()
    })

    it('should accept an optional initial state', () => {
      expectTypeOf(queryCache.build<{ value: string }, CustomError>)
        .parameter(2)
        .toEqualTypeOf<QueryState<{ value: string }, CustomError> | undefined>()
    })

    it('should default its type parameters', () => {
      const query = queryCache.build(queryClient, { queryKey: queryKey() })

      expectTypeOf(query.state).toEqualTypeOf<
        QueryState<unknown, DefaultError>
      >()
      expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
      expectTypeOf(query.state.error).toEqualTypeOf<DefaultError | null>()
    })
  })

  describe('get', () => {
    it('should carry its type parameters into the query it returns', () => {
      expectTypeOf(
        queryCache.get<{ value: string }, CustomError>('hash'),
      ).toEqualTypeOf<
        | Query<
            { value: string },
            CustomError,
            { value: string },
            ReadonlyArray<unknown>
          >
        | undefined
      >()
    })

    it('should take a query hash and default its type parameters', () => {
      expectTypeOf(queryCache.get).parameters.toEqualTypeOf<
        [queryHash: string]
      >()
      expectTypeOf(queryCache.get('hash')).toEqualTypeOf<
        Query<unknown, DefaultError, unknown, QueryKey> | undefined
      >()
    })

    it('should accept a queryKey type parameter, unlike find', () => {
      expectTypeOf(
        queryCache.get<
          { value: string },
          CustomError,
          { value: string },
          readonly ['a', 1]
        >('hash'),
      ).toEqualTypeOf<
        | Query<
            { value: string },
            CustomError,
            { value: string },
            readonly ['a', 1]
          >
        | undefined
      >()
    })
  })

  describe('getAll', () => {
    it('should return an array of fully defaulted queries', () => {
      expectTypeOf(queryCache.getAll()).toEqualTypeOf<
        Array<Query<unknown, DefaultError, unknown, QueryKey>>
      >()
    })

    it('should take no arguments', () => {
      expectTypeOf(queryCache.getAll).parameters.toEqualTypeOf<[]>()
    })
  })

  describe('find', () => {
    it('should carry its type parameters into the query it returns', () => {
      expectTypeOf(
        queryCache.find<{ value: string }, CustomError>({
          queryKey: queryKey(),
        }),
      ).toEqualTypeOf<
        | Query<{ value: string }, CustomError, { value: string }, QueryKey>
        | undefined
      >()
    })

    it('should require a queryKey in the filters it is given', () => {
      // @ts-expect-error a queryKey is required
      queryCache.find({})

      expectTypeOf(queryCache.find)
        .parameter(0)
        .toHaveProperty('queryKey')
        .toEqualTypeOf<ReadonlyArray<unknown>>()
    })

    it('should default its type parameters', () => {
      expectTypeOf(queryCache.find({ queryKey: queryKey() })).toEqualTypeOf<
        Query<unknown, DefaultError, unknown, QueryKey> | undefined
      >()
    })
  })

  describe('findAll', () => {
    it('should return an array of fully defaulted queries', () => {
      expectTypeOf(queryCache.findAll({ queryKey: queryKey() })).toEqualTypeOf<
        Array<Query<unknown, DefaultError, unknown, QueryKey>>
      >()
    })

    it('should accept filters or nothing', () => {
      queryCache.findAll()
      queryCache.findAll({ queryKey: queryKey() })
      queryCache.findAll({ stale: true })
      // @ts-expect-error stale must be a boolean
      queryCache.findAll({ stale: 'yes' })

      expectTypeOf(queryCache.findAll).parameters.toEqualTypeOf<
        [filters?: QueryFilters<any>]
      >()
    })
  })

  describe('add', () => {
    it('should take a single query and return void', () => {
      expectTypeOf(queryCache.add).returns.toEqualTypeOf<void>()
      expectTypeOf(queryCache.add).parameters.toEqualTypeOf<
        [query: Query<any, any, any, any>]
      >()
    })
  })

  describe('remove', () => {
    it('should take a single query and return void', () => {
      expectTypeOf(queryCache.remove).returns.toEqualTypeOf<void>()
      expectTypeOf(queryCache.remove).parameters.toEqualTypeOf<
        [query: Query<any, any, any, any>]
      >()
    })
  })

  describe('clear', () => {
    it('should take no arguments and return void', () => {
      expectTypeOf(queryCache.clear).parameters.toEqualTypeOf<[]>()
      expectTypeOf(queryCache.clear).returns.toEqualTypeOf<void>()
    })
  })

  describe('notify', () => {
    it('should only accept a notify event and return void', () => {
      expectTypeOf(queryCache.notify).parameters.toEqualTypeOf<
        [event: QueryCacheNotifyEvent]
      >()
      expectTypeOf(queryCache.notify).returns.toEqualTypeOf<void>()
    })
  })

  describe('onFocus', () => {
    it('should take no arguments and return void', () => {
      expectTypeOf(queryCache.onFocus).parameters.toEqualTypeOf<[]>()
      expectTypeOf(queryCache.onFocus).returns.toEqualTypeOf<void>()
    })
  })

  describe('onOnline', () => {
    it('should take no arguments and return void', () => {
      expectTypeOf(queryCache.onOnline).parameters.toEqualTypeOf<[]>()
      expectTypeOf(queryCache.onOnline).returns.toEqualTypeOf<void>()
    })
  })
})
